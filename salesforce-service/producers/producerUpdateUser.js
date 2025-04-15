const amqp = require('amqplib');
const { Builder } = require('xml2js');
const { getConnection } = require('../salesforce');
const Faye = require('faye');

async function checkUpdatedUsers() {
    console.log("checking updated users");
    try {
        const conn = await getConnection();
        const connection = await amqp.connect(process.env.RABBITMQ_URL);
        const channel = await connection.createChannel();
        const instanceUrl = conn.instanceUrl;
        const accessToken = conn.accessToken;

        const client = new Faye.Client(`${instanceUrl}/cometd/58.0`, {
            timeout: 60,
            retry: 5,
        });

        client.setHeader('Authorization', `Bearer ${accessToken}`);

        const subscription = client.subscribe('/event/updated_producer__e', async (message) => {
            const user = message.payload;
            if (user.LastModifiedDate !== user.CreatedDate) {
                console.log('Received updated user message:', message);
                const builder = new Builder();
                const mappedUserXML = mapXML(user);
                const messageXML = builder.buildObject(mappedUserXML);
                channel.publish("user-management", "user.update", Buffer.from(messageXML));
                console.log(`Message sent for updated user: ${user}`);
            } else {
                console.log(`Skipping user ${user.Id} as it was just created.`);
            }

        })
    } catch (error) {
        console.error('Error in producer:', error);
    }


    function mapXML(userXML) {
        const mappedUserXML = {
            attendify: {
                info: {
                    sender: 'crm',
                    operation: 'update',
                },
                user: {
                    // id: userXML.Id,
                    first_name: userXML.first_name__c,
                    last_name: userXML.last_name__c,
                    // date_of_birth: userXML.dob__c,
                    // phone_number: userXML.phone__c,
                    title: userXML.title__c,
                    email: userXML.email__c,
                    // address: {
                    //     street: userXML.street_name__c,
                    //     number: userXML.house_number__c,
                    //     bus_number: userXML.bus_number__c,
                    //     city: userXML.city__c,
                    //     province: userXML.province__c,
                    //     country: userXML.country__c,
                    //     postal_code: userXML.postcode__c,
                    // },

                    // payment_details: {
                    //     facturation_address: {
                    //         street: userXML.street_name__c,
                    //         number: userXML.house_number__c,
                    //         bus_number: userXML.bus_number__c,
                    //         city: userXML.city__c,
                    //         province: userXML.province__c,
                    //         country: userXML.country__c,
                    //         postal_code: userXML.postcode__c,
                    //     },
                    //     payment_method: '',
                    //     card_number: '',
                    // },
                    // email_registered: userXML.email_registered__c,

                    // company: {
                    //     id: userXML.company_id__c,
                    //     name: '',
                    //     VAT_number: '',
                    //     address: {
                    //         street: '',
                    //         number: '',
                    //         bus_number: '',
                    //         city: '',
                    //         province: '',
                    //         country: '',
                    //         postal_code: '',
                    //     },
                    // },
                }
            }
        }
        return mappedUserXML;
    }
}
module.exports = checkUpdatedUsers;