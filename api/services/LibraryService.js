
var fs = require('fs');

const libraryMysqlServer = {
		user: 'root',
        password: 'abcd1234',
        port: '3306',
        host: 'localhost',
        database: 'library',
        dateStrings: true
};

module.exports = {

fetchUsers(req){
    console.info('Calling Service fetchUsers now ');
    return new Promise((resolve, reject) => {
      try {
        const fetchUserQuery="select firstName from users ";
        console.log(insertDQRulesQuery);
        MysqlService.query(libraryMysqlServer, fetchUserQuery, {})
        .then(sqlDataDQRules => {
          console.info(sqlDataDQRules);
          var dataReturned={
            ruleId:sqlDataDQRules.insertId
          }
          resolve(dataReturned);

        }).catch(error => {
          reject(error);
        });
      }catch(exception) {
        reject(exception.message);
      }
    });
  }
}