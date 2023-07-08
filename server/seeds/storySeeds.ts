import { Story, Pages, Artwork } from '../database/index.js';


const createSeedData = async () => {
  try {
    const userId = 'fakeId';
    const artwork = await Artwork.create({ type: 'story', userId });
    const { id: artworkId } = artwork.dataValues;
    const story = await Story.create({
      artworkId,
      title: 'Taming of the Lion',
      coverImage: 'https://res.cloudinary.com/dhin8tgv1/image/upload/v1687649608/uploads/nmg09penyneghplbikt2.png',
    });

    const pagesData = [];
    for (let i = 1; i <= 4; i++) {
      pagesData.push({
        page_number: i,
        content: '',
        storyId: story.getDataValue('id'),
      });
    }

    await Pages.bulkCreate(pagesData);

    console.log('Seed data created successfully!');
  } catch (error) {
    console.error('Error creating seed data:', error);
  }
};

export default createSeedData;