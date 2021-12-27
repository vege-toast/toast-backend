const Sequelize=require('sequelize');

module.exports = class Keyword extends Sequelize.Model{
    static init (sequelize){
        return super.init({
            created_at : {
                type:Sequelize.DATE,
                allowNull:false,
                defaultValue: Sequelize.Now,
            },
            word:{
                type:Sequelize.STRING,
                allowNull:false,
                
            }
        },{
            sequelize,
            timestamps: false,
            underscored: false,
            modelName: 'Keyword',
            tableName: 'keywords',
            paranoid: false,
            charset: 'utf8',
            collate: 'utf8_general_ci',
        })
    }
    static associate(db) {
        db.Keyword.belongsTo(db.User, { foreignKey: 'owner', targetKey: 'id' });//관계 정의
      }
};
