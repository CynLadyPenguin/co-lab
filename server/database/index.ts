import { Sequelize, DataTypes } from 'sequelize';
const { DB_NAME, DB_USER, DB_PW } = process.env;

const sequelize = new Sequelize(DB_NAME || 'colab', DB_USER || 'root', DB_PW || '', {
  host: 'localhost',
  dialect: 'postgres',
  define: {
    freezeTableName: true
  },
  logging: false
});

const User = sequelize.define('users', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
  },
  email: {
    type: DataTypes.STRING,
  },
  friends: {
    type: DataTypes.ARRAY(DataTypes.INTEGER),
  },
  picture: {
    type: DataTypes.STRING,
  },
});

const Message = sequelize.define('messages', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
  },
  text: {
    type: DataTypes.STRING,
  },
});

const Artwork = sequelize.define('artwork', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING,
  },
});

const VisualArt = sequelize.define('visualart', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
  },
  content: {
    type: DataTypes.TEXT,
  },
  url: {
    type: DataTypes.TEXT,
  },
});

const Music = sequelize.define('music', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
  },
  content: {
    type: DataTypes.TEXT,
  },
  url: {
    type: DataTypes.TEXT,
  },
});

const Story = sequelize.define('stories', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
  },
  coverImage: {
    type: DataTypes.STRING,
  },
  numberOfPages: {
    type: DataTypes.INTEGER,
  }
});

const Pages = sequelize.define('pages', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
    autoIncrement: true
  },
  page_number: {
    type: DataTypes.INTEGER
  },
  content: {
    type: DataTypes.TEXT
  }
});

const Sculpture = sequelize.define('sculptures', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
  },
  content: {
    type: DataTypes.TEXT,
  },
});

const Collaboration = sequelize.define('collaborations', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
  },
  artworkType: {
    type: DataTypes.STRING,
    field: 'artwork_type',
  },
  isPrivate: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_private',
  },
});

const UserCollaboration = sequelize.define('usercollaborations', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
  },
});

VisualArt.belongsTo(Artwork, { foreignKey: 'artworkId' });
Music.belongsTo(Artwork, { foreignKey: 'artworkId' });
Story.belongsTo(Artwork, { foreignKey: 'artworkId' });
Story.belongsTo(User, { foreignKey: 'originalCreatorId' });
Sculpture.belongsTo(Artwork, { foreignKey: 'artworkId' });
UserCollaboration.belongsTo(Collaboration, { foreignKey: 'collaborationId' });
UserCollaboration.belongsTo(User, { foreignKey: 'userId' });
Message.belongsTo(User, { foreignKey: 'userId' });
Message.belongsTo(User, { foreignKey: 'recipientId' });
Pages.belongsTo(Story, { foreignKey: 'storyId' })

const initialize = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('Tables successfully created!');
  } catch (error) {
    console.error('Error creating tables :(', error);
  }
};

export {
  sequelize,
  initialize,
  User,
  Message,
  Artwork,
  VisualArt,
  Music,
  Story,
  Sculpture,
  Collaboration,
  UserCollaboration,
  Pages,
};

