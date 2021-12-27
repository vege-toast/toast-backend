const Sequelize=require('sequelize');

module.exports=class User extends Sequelize.Model{
    static init (sequelize){
        return super.init({
            id:{
                type: Sequelize.STRING,
                allowNull: false,
                unique: true,
                primaryKey: true,
            },
            pw:{
                type:Sequelize.STRING,
                allowNull:false,
            },
            created_at : {
                type:Sequelize.DATE,
                allowNull:false,
                defaultValue: Sequelize.Now,
            },
        },{
            sequelize,
            timestamps: false,
            underscored: false,
            modelName: 'User',
            tableName: 'users',
            paranoid: false,
            charset: 'utf8',
            collate: 'utf8_general_ci',
        })
    }
    static associate(db) {
        db.User.hasMany(db.Keyword,{foreignKey:'owner',sourceKey:'id'});
        db.User.hasMany(db.Session,{foreignKey:'owner',sourceKey:'id'});
      }
};