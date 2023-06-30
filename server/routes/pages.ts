import { Router } from 'express';
import { Pages, Story } from '../database/index.js';

const pagesRouter = Router();

pagesRouter.post('/', async (req, res) => {
  try {
    const { page_number, content, storyId } = req.body;

    //create the page and save it to the database
    const page: any = await Pages.create({
      page_number: page_number,
      content,
      storyId,
    });
    res.status(201).json(page);
  } catch (error) {
    console.error('this is a router error', error);
    res.status(500).json({ message: 'Failed to create the page-router' });
  }
});

pagesRouter.put('/:id', async (req, res) => {
  try {
    const pageId = req.params.id;
    const { content } = req.body;

    const page: any = await Pages.findOne({ where: { id: pageId } });

    if (page) {
      page.content = content;
      await page.save();
      res.status(200).json(page);
    } else {
      console.error('Page not found:', pageId);
      res.status(404).json({ message: 'Page not found' });
    }
  } catch (error) {
    console.error('Failed to update the page-router:', error);
    res.status(500).json({ message: 'Failed to update the page-router' });
  }
});


pagesRouter.get('/', async (req, res) => {
  try {
    const storyId = req.query.storyId;
    const pages = await Pages.findAll({
      where: {
        storyId: storyId
      }
    });

    res.json(pages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch pages-router' });
  }
});


export default pagesRouter;