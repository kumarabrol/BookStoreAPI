/**
 * BookController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  

    FetchUsersRecords:function (req, res) {
    console.info('Calling FetchUsersRecords' );

    LibraryService.fetchUsers().then(data => {
        console.info("data.."+data)
        res.ok(data);
    }).catch((err) => {
        console.log('Inside error');
        res.badRequest(err);
    }); 
}

};

