const { getConnection } = require('./salesforce');

class UserService {
    static async createUser(userData) {
      try {
          const conn = await getConnection();
          return await conn.sobject('Users_CRM__c').create({
            email__c: userData.email__c,
            first_name__c: userData.first_name__c,
            last_name__c: userData.last_name__c,
            bus_number__c: userData.bus_number__c,
            city__c: userData.city__c,
            company_id__c: userData.company_id__c,
            country__c: userData.country__c,
            created_at__c: new Date().toISOString(),
            dob__c: userData.dob__c,
            email_registered__c: userData.email_registered__c,
            house_number__c: userData.house_number__c,
            phone__c: userData.phone__c,
            province__c: userData.province__c,
            street_name__c: userData.street_name__c,
            title__c: userData.title__c,
            updated_at__c: new Date().toISOString(),
            created_by_crm_ui__c: 0,
        });
      } catch (error) {
          console.error('Error in creating user:', error);
          throw error;
      }
    }

    static async updateUser(userData) {
      try {
          const conn = await getConnection();
          
          const result = await conn.sobject('Users_CRM__c')
              .find({ email__c: userData.email__c })
              .execute();
          
          if (result) {
              const user = result[0];
              const userToUpdate = { Id: user.Id };
              for (const [key, value] of Object.entries(userData)) {
                if (value !== null) {
                    userToUpdate[key] = value;
                }
              }
              return await conn.sobject('Users_CRM__c').update(userToUpdate);
            
          }
      } catch (error) {
        console.error('Error in updating user:', error);
        throw error;
      } 
    }

    static async deleteUser(email){
      try{
        const conn = await getConnection();
  
        const query = `SELECT Id FROM Users_CRM__c WHERE email__c = '${email}'`
        const result = await conn.query(query);
  
        if (result.records.length === 0){
          console.log(`No user found with email: ${email}`)
          return { success: false, message: 'User not found' }
        }
  
        const userId = result.records[0].Id;
  
        await conn.sobject('Users_CRM__c').destroy(userId);
        console.log(`User with email ${email} deleted successfully.`);
        return { success: true, message: 'User deleted successfully' };
      }catch (error) {
        console.error(`Error deleting user with email ${email}:`, error);
        return { success: false, message: 'Error deleting user', error };
      }
    }
}

module.exports = UserService;