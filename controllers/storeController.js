const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const User = mongoose.model('User');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');

const multerOptions = {
    storage: multer.memoryStorage(),
    fileFilter(req, file, next){
        const isPhoto = file.mimetype.startsWith('image/');
        if(isPhoto){
            next(null, true);
        } else {
            next({ message: 'That filetype isn\'t allowed!' }, false);
        }
    }
};

exports.homePage = (req, res) => {
    console.log(res.name);
    res.render('index', {title:'Home'});
};

exports.addStore = (req, res) => {
    res.render('editStore', {title: 'Add Store'});
}

exports.upload = multer(multerOptions).single('photo');

exports.resize = async (req, res, next) => {
    //check if there is no file to resize
    if(!req.file) {
        next();// skip to next middleware
        return;
    }
    // console.log(req.file);
    const extension = req.file.mimetype.split('/')[1];
    req.body.photo = `${uuid.v4()}.${extension}`;
    //now we resize
    const photo = await jimp.read(req.file.buffer);
    await photo.resize(800, jimp.AUTO);
    await photo.write(`./public/uploads/${req.body.photo}`);
    //once we have written photo to our filesystem, keep going
    next();
}

exports.createStore = async (req, res) => {
    //console.log(res.body);
    req.body.author = req.user._id;
    //res.json(req.body);//to check the post data received
    const store = await (new Store(req.body)).save();
    //await store.save();
    //console.log('it worked');
    req.flash('success', `Successfully created ${store.name}. Care to leave a review?`);
    res.redirect(`/store/${store.slug}`);
}

exports.getStores = async (req, res) => {
    // per page limit
    const page = req.params.page || 1;
    const limit = 4;
    const skip = (page * limit) - limit;

    const storesPromise = Store
        .find()
        .skip(skip)
        .limit(limit)
        .sort({ created: 'desc' });
    
    const countPromise = Store.count();
    const [stores, count] = await Promise.all([storesPromise, countPromise]);
    const pages = Math.ceil(count / limit);

    if(!stores.length && skip) {
        req.flash('info', `Hey! You asked for page ${page}. But that doesn't exist. So I put you on page ${pages}`);
        res.redirect(`/stores/page/${pages}`);
        return; 
    }

    res.render('stores', {title:'Stores', stores, count, pages, page });
}

exports.getStoreBySlug = async (req, res, next) => {
    const store = await Store.findOne({ slug: req.params.slug }).populate('author reviews');
    //res.json(store);
    if(!store) return next();//if the slug is not in db skip this fn
    res.render('store', { title: store.name, store });
}

const confirmOwner = (store, user) => {
    if(!store.author.equals(user._id)) {
        throw Error('You must own a store in order to edit it!');
    };
}

exports.editStore = async (req, res) => {
    //1. find the store given the id
    const store = await Store.findOne({ _id: req.params.id });
    //2. confirm they are the owner of the store
    //TODO
    confirmOwner(store, req.user)
    //3. render out the edit form so user can update the store
    res.render('editStore', {title:`Edit ${store.name}`, store });
}

exports.updateStore = async (req, res) => {
    //set the location data to be point
    req.body.location.type = 'Point';
    //1. find & update the store 
    const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
        new: true,// return the new store instead of the old one
        runValidators: true
    }).exec();
    //2. show the flash message and redirect to updated store
    req.flash('success', `Successfully updated ${store.name}. <a href="/stores/${store.slug}">View Store!</a> `);
    res.redirect(`/stores/${store._id}/edit`);
}

exports.getStoresByTag = async (req, res) => {
    const tag = req.params.tag;
    const tagQuery = tag || { $exists: true };
    const tagsPromise = Store.getTagsList();
    const storesPromise = Store.find({ tags: tagQuery });
    const result = await Promise.all([tagsPromise, storesPromise]);
    const [tags, stores] = result;
    res.render('tag', { title: 'Tags', tags, tag, stores });
}

exports.searchStores = async (req, res) => {
    const stores = await Store
    //first find stores that match
    .find({
        $text: {
            $search: req.query.q
        }
    }, {
        score: { $meta: 'textScore' }
    })
    // sort them
    .sort({
        score: { $meta: 'textScore' }
    })
    //limit to only 5
    .limit(5);
    res.json(stores);
};

exports.mapStores = async (req, res) => {
  const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
  const q = {
      location: {
          $near: {
              $geometry: {
                  type: 'Point',
                  coordinates
              },
              $maxDistance: 10000 // within 10km
          }
      }
  };
  
  const stores = await Store.find(q).select('slug name description location photo').limit(10);
  res.json(stores);
};

exports.mapPage = (req, res) => {
    res.render('map', { title:'Map' });
}

exports.heartStore = async (req, res) => {
    const hearts = req.user.hearts.map(obj=> obj.toString());
    // console.log(hearts);//
    const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet' ;
    const user = await User.findByIdAndUpdate(req.user._id,
     { [operator]: {hearts: req.params.id }},
     { new: true }
    );
    res.json(user);
};

exports.getHearts = async (req, res) => {
    const stores = await Store.find({
        _id: { $in: req.user.hearts }
    });

    res.render('stores', { title: 'Hearted Stores', stores });
};

exports.getTopStores = async (req, res) => {
    const stores = await Store.getTopStores();
    // res.json(stores);
    res.render('topStores', { stores, title: 'Top Stores' });
}
