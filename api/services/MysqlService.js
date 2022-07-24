const mysql = require('mysql');

var pools = {};
// get all connection parameters required to establish connection with MYSQL
const libraryMysqlServer = function(options) {
  const opt = {
        user: 'root',
        password: 'abcd1234',
        port: '3306',
        host: 'localhost',
        database: 'library',
        dateStrings: true
  };
  return opt;
};

// to establish connnection with MYSQL
const getConnection = function(options) {
  if ( !options ) {
    options = sails.config.base.mysql;
  }
  return mysql.createConnection(libraryMysqlServer(options));
};

const testConnection = function (options) {
  try {
    if (options) {
      const { host, port, user, password } = options;
      if ( host && user && password && port) {
        return new Promise((resolve, reject) => {
          const connection = mysql.createConnection({
            host,
            port,
            user,
            password
          });
          connection.connect(function(err) {
            if (err) {
              const connectionError = err.stack;
              reject(connectionError);
            }
            console.log('connected as id ' + connection.threadId);
            resolve(connection.threadId);
          });
        })
      }else {
        throw new Error("Required attributes to test connection are {host, user & password }. Options is missing some required attributes. Please check");
      }
    }else {
      throw new Error("Options are not available. Please check");
    }
  }catch(exception) {
    return Promise.reject(exception.message);
  }
}

/**
 * Generates a unique key by configuration options object
 * Key Generated = IP/domain+host+databaseName
 * @param options
 * @returns connectionPoolKey
 */
const getMysqlPoolKey = function(options) {
  const { host, port,  database } = options;
  const keyHost = host.split(".").join("");
  const keyPort = port || "";
  const keyDatabase = database || "";
  const poolKey = keyHost+keyPort+keyDatabase;
  return poolKey;
};

//  to establish connection to MYSQL database
const connect = function() {

  let callBack, options;
  if (_.isFunction(arguments[0])) {
    callBack = arguments[0];
  } else if (_.isObject(arguments[0]) && _.isFunction(arguments[1])) {
    options = arguments[0];
    callBack = arguments[1];
  }

  // console.log('\n\n To establish connection to MYSQL database',options,'\n');

  if (!callBack) {
    throw new Error('Parameter type wrong for MysqlService.connect');
  }
  if ( !options) {
    options = sails.config.base.mysql;
  }
  const poolKey = getMysqlPoolKey(options);
  if (!pools[poolKey]) {
    pools[poolKey] = mysql.createPool(libraryMysqlServer(options));
  }
  return pools[poolKey].getConnection(callBack);
  
};


// to invoke the transaction in MYSQL
const transaction = function(callBack) {
  return connect(function(err, conn) {
    if (err) {
      return callBack(err, null);
    }
    return conn.beginTransaction(function(transErr) {
      if (transErr) {
        conn.release();
        return callBack(transErr, null);
      }
      return callBack(null, conn);
    });
  });
};



/*
  Auto kill timeout sql
 */

// to get the process time list from MYSQL schema tables
const processTimeout = function(options, sql, err) {
  if (err.code === 'PROTOCOL_SEQUENCE_TIMEOUT') {
    let processSql = "SELECT ID FROM INFORMATION_SCHEMA.PROCESSLIST WHERE COMMAND = 'Query' and INFO = ? ORDER BY TIME desc";
    processSql = MysqlService.format(processSql, sql);
    return MysqlService.query(options, processSql)
      .then(function(ret) {
      if (ret && ret.length) {
        const id = ret[0].ID;
        const killSql = "kill " + id;
        return MysqlService.query(options, killSql);
      }
    })
      .catch(err => {
        console.info ('Error inside process timeout');
        console.info (err);
      })
      ;
  }
};


/*
  query with sql
 */

// query MYSQL
const query = function(options, sql, data) {
  return new Promise((resolve, reject) => {
    connect(options, function(err, conn) {
      if (err) {
        reject(err);
      } else {
        if (data == null) {
          data = {};
        }
        const defaultTimeout = 1200000;
        return conn.query({
          sql: sql,
          timeout: defaultTimeout
        }, data, function(err, data) {
          if (err) {
            processTimeout(options, sql, err);
            reject(err);
          } else {
            // console.log ('Data in Query', data);
            resolve(data);
          }
          return conn.release();
        });
      }
    });
  })

};


module.exports = {
  getConnection,
  connect,
  transaction,
  query,
};