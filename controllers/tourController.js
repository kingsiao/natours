// const fs = require('fs');

const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('./../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');
const multer = require('multer');
const sharp = require('sharp');
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  // console.log(req.files);

  if (!req.files.imageCover || !req.files.images) return next();

  // 1. cover image
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.body.imageCover}`);

  // 2. images
  req.body.image = [];
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/users/${filename}`);

      req.body.images.push(filename);
    })
  );

  next();
});

// aliasing
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );

// exports.checkID = (req, res, next, val) => {
//   if (req.params.id * 1 > tours.length) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'Invalid ID',
//     });
//   }
//   next();
// };

// exports.checkBody = (req, res, next) => {
//   if (!req.body.name || !req.body.price) {
//     return res.status(400).json({
//       status: 'fail',
//       message: 'missing name or price',
//     });
//   }
//   next();
// };

// class APIFeatures {
//   constructor(query, queryString) {
//     this.query = query;
//     this.queryString = queryString;
//   }

//   filter() {
//     // 1. Filtering
//     const queryObj = { ...this.queryString };
//     const excludedFields = ['page', 'sort', 'limit', 'fields'];
//     excludedFields.forEach((el) => delete queryObj[el]);
//     // console.log(req.query, queryObj);

//     // 2. Advanced filtering
//     let queryStr = JSON.stringify(queryObj);
//     queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
//     this.query.find(JSON.parse(queryStr));
//     // let query = Tour.find(JSON.parse(queryStr));

//     return this;
//   }

//   sort() {
//     // 3. Sorting
//     if (this.queryString.sort) {
//       const sortBy = this.queryString.sort.split(',').join(' ');
//       // console.log(sortBy);
//       this.query = this.query.sort(sortBy);
//     } else {
//       this.query = this.query.sort('-createdAt');
//     }

//     return this;
//   }

//   limitFields() {
//     // 4. Field limiting
//     if (this.queryString.fields) {
//       const fields = this.queryString.fields.split(',').join(' ');
//       this.query = this.query.select(fields);
//     } else {
//       this.query = this.query.select('-__v');
//     }

//     return this;
//   }

//   paginate() {
//     // 5. Pagination
//     const page = this.queryString.page * 1 || 1;
//     const limit = this.queryString.limit * 1 || 100;
//     const skip = (page - 1) * limit;
//     // page=3&limit=10, 1-10 page 1, 11-20 page 2, 21-30 page 3
//     this.query = this.query.skip(skip).limit(limit);

//     // if (this.queryString.page) {
//     //   const numTours = await Tour.countDocuments();
//     //   if (skip >= numTours) throw new Error('This page does not exist');
//     // }

//     return this;
//   }
// }

exports.getAllTours = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const tours = await features.query;

  // SEND RESPONSE
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours: tours,
    },
  });

  // try {
  //   // // BUILD QUERY
  //   // // 1. Filtering
  //   // const queryObj = { ...req.query };
  //   // const excludedFields = ['page', 'sort', 'limit', 'fields'];
  //   // excludedFields.forEach((el) => delete queryObj[el]);

  //   // console.log(req.query, queryObj);

  //   // // 2. Advanced filtering
  //   // let queryStr = JSON.stringify(queryObj);
  //   // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
  //   // console.log(JSON.parse(queryStr));
  //   // // { difficulty: 'easy', duration: { $gte: 5 } }
  //   // // { difficulty: 'easy', duration: { gte: 5 } }
  //   // // gte, gt, lte, lt

  //   // 1st option for queries
  //   // const query = Tour.find(queryObj);
  //   // let query = Tour.find(JSON.parse(queryStr));

  //   // 2nd option for queries
  //   // const tours = await Tour.find(req.query);

  //   // 3rd option for queries
  //   // const tours = await Tour.find({
  //   //   duration: 5,
  //   //   difficulty: 'easy',
  //   // });

  //   // 4th option for queries
  //   // const tours = await Tour.find()
  //   //   .where('duration')
  //   //   .equals(5)
  //   //   .where('difficulty')
  //   //   .equals('easy');

  //   // console.log(req.requestTime);

  //   // // 3. Sorting
  //   // if (req.query.sort) {
  //   //   const sortBy = req.query.sort.split(',').join(' ');
  //   //   console.log(sortBy);
  //   //   query = query.sort(sortBy);
  //   // } else {
  //   //   query = query.sort('-createdAt');
  //   // }

  //   // // 4. Field limiting
  //   // if (req.query.fields) {
  //   //   const fields = req.query.fields.split(',').join(' ');
  //   //   query = query.select(fields);
  //   // } else {
  //   //   query = query.select('-__v');
  //   // }

  //   // // 5. Pagination
  //   // const page = req.query.page * 1 || 1;
  //   // const limit = req.query.limit * 1 || 100;
  //   // const skip = (page - 1) * limit;
  //   // // page=3&limit=10, 1-10 page 1, 11-20 page 2, 21-30 page 3
  //   // query = query.skip(skip).limit(limit);

  //   // if (req.query.page) {
  //   //   const numTours = await Tour.countDocuments();
  //   //   if (skip >= numTours) throw new Error('This page does not exist');
  //   // }

  //   // EXECUTE QUERY
  //   const features = new APIFeatures(Tour.find(), req.query)
  //     .filter()
  //     .sort()
  //     .limitFields()
  //     .paginate();
  //   const tours = await features.query;
  //   // query.sort().select().skip().limit()

  //   // SEND RESPONSE
  //   res.status(200).json({
  //     status: 'success',
  //     // requestedAt: req.requestTime,
  //     results: tours.length,
  //     data: {
  //       tours: tours,
  //     },
  //   });
  // } catch (err) {
  //   res.status(404).json({
  //     status: 'fail',
  //     message: err,
  //   });
  // }
});
// exports.getAllTours = factory.getAll(Tour);

// exports.getTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findById(req.params.id).populate('reviews');

//   if (!tour) {
//     return next(new AppError('No tour found with that ID', 404));
//   }

//   res.status(200).json({
//     status: 'success',
//     data: {
//       tours: tour,
//     },
//   });

//   // try {
//   //   const tour = await Tour.findById(req.params.id);
//   //   // Tour.findOne({ _id: req.params.id });

//   //   // console.log(req.params);
//   //   // const id = req.params.id * 1;
//   //   // const tour = tours.find((el) => el.id === id);
//   //   // if(id > tours.length)
//   //   // if(!tour) {
//   //   //   return res
//   //   //     .status(404)
//   //   //     .json({
//   //   //       status: 'fail',
//   //   //       message: 'Invalid ID'
//   //   //     })
//   //   // }
//   //   res.status(200).json({
//   //     status: 'success',
//   //     data: {
//   //       tours: tour,
//   //     },
//   //   });
//   // } catch (err) {
//   //   res.status(404).json({
//   //     status: 'fail',
//   //     message: err,
//   //   });
//   // }
// });
exports.getTour = factory.getOne(Tour, { path: 'reviews' });

// const catchAsync = (fn) => {
//   return (req, res, next) => {
//     fn(req, res, next).catch(next);
//   };
// };

// exports.createTour = catchAsync(async (req, res, next) => {
//   const newTour = await Tour.create(req.body);

//   res.status(201).json({
//     status: 'success',
//     data: {
//       tour: newTour,
//     },
//   });

//   // try {
//   //   const newTour = await Tour.create(req.body);

//   //   res.status(201).json({
//   //     status: 'success',
//   //     data: {
//   //       tour: newTour,
//   //     },
//   //   });
//   //   // console.log(req.body)
//   //   // const newId = tours[tours.length - 1].id + 1;
//   //   // const newTour = Object.assign({ id: newId }, req.body);
//   //   // tours.push(newTour);
//   //   // fs.writeFile(
//   //   //   `${__dirname}/dev-data/data/tours-simple.json`,
//   //   //   JSON.stringify(tours),
//   //   //   (err) => {
//   //   //     res.status(201).json({
//   //   //       status: 'success',
//   //   //       data: {
//   //   //         tour: newTour,
//   //   //       },
//   //   //     });
//   //   //   }
//   //   // );
//   // } catch (err) {
//   //   res.status(400).json({
//   //     status: 'fail',
//   //     // message: err,
//   //     message: err,
//   //   });
//   // }
// });
exports.createTour = factory.createOne(Tour);

// exports.updateTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//     new: true,
//     runValidators: true,
//   });

//   if (!tour) {
//     return next(new AppError('No tour found with that ID', 404));
//   }

//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour: tour,
//     },
//   });

//   // try {
//   //   const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//   //     new: true,
//   //     runValidators: true,
//   //   });

//   //   // if(req.params.id * 1 > tours.length) {
//   //   //   return res
//   //   //     .status(404)
//   //   //     .json({
//   //   //       status: 'fail',
//   //   //       message: 'Invalid ID'
//   //   //     })
//   //   // }
//   //   res.status(200).json({
//   //     status: 'success',
//   //     data: {
//   //       tour: tour,
//   //     },
//   //   });
//   // } catch (err) {
//   //   res.status(400).json({
//   //     status: 'fail',
//   //     message: err,
//   //   });
//   // }
// });
exports.updateTour = factory.updateOne(Tour);

// exports.deleteTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndDelete(req.params.id);

//   if (!tour) {
//     return next(new AppError('No tour found with that ID', 404));
//   }

//   res.status(204).json({
//     status: 'success',
//     data: null,
//   });

//   // try {
//   //   await Tour.findByIdAndDelete(req.params.id);

//   //   // if(req.params.id * 1 > tours.length) {
//   //   //   return res
//   //   //     .status(404)
//   //   //     .json({
//   //   //       status: 'fail',
//   //   //       message: 'Invalid ID'
//   //   //     })
//   //   // }

//   //   res.status(204).json({
//   //     status: 'success',
//   //     data: null,
//   //   });
//   // } catch (err) {
//   //   res.status(400).json({
//   //     status: 'fail',
//   //     message: err,
//   //   });
//   // }
// });
exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRating: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 }, // 1 - ascending
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats: stats,
    },
  });

  // try {
  //   const stats = await Tour.aggregate([
  //     {
  //       $match: { ratingsAverage: { $gte: 4.5 } },
  //     },
  //     {
  //       $group: {
  //         _id: { $toUpper: '$difficulty' },
  //         numTours: { $sum: 1 },
  //         numRating: { $sum: '$ratingsQuantity' },
  //         avgRating: { $avg: '$ratingsAverage' },
  //         avgPrice: { $avg: '$price' },
  //         minPrice: { $min: '$price' },
  //         maxPrice: { $max: '$price' },
  //       },
  //     },
  //     {
  //       $sort: { avgPrice: 1 }, // 1 - ascending
  //     },
  //     // excludes 'EASY'
  //     // {
  //     //   $match: { _id: { $ne: 'EASY' } },
  //     // },
  //   ]);

  //   res.status(200).json({
  //     status: 'success',
  //     data: {
  //       stats: stats,
  //     },
  //   });
  // } catch (err) {
  //   res.status(404).json({
  //     status: 'fail',
  //     message: err,
  //   });
  // }
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: {
        numTourStarts: -1,
      },
    },
    {
      $limit: 12,
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan,
    },
  });

  // try {
  //   const year = req.params.year * 1;
  //   const plan = await Tour.aggregate([
  //     {
  //       $unwind: '$startDates',
  //     },
  //     {
  //       $match: {
  //         startDates: {
  //           $gte: new Date(`${year}-01-01`),
  //           $lte: new Date(`${year}-12-31`),
  //         },
  //       },
  //     },
  //     {
  //       $group: {
  //         _id: { $month: '$startDates' },
  //         numTourStarts: { $sum: 1 },
  //         tours: { $push: '$name' },
  //       },
  //     },
  //     {
  //       $addFields: { month: '$_id' },
  //     },
  //     {
  //       $project: {
  //         _id: 0,
  //       },
  //     },
  //     {
  //       $sort: {
  //         numTourStarts: -1,
  //       },
  //     },
  //     {
  //       $limit: 12,
  //     },
  //   ]);

  //   res.status(200).json({
  //     status: 'success',
  //     data: {
  //       plan: plan,
  //     },
  //   });
  // } catch (err) {
  //   res.status(404).json({
  //     status: 'fail',
  //     message: err,
  //   });
  // }
});

// /tours-within/:distance/center/:latlng/unit/:unit
// /tours-within/233/center/34.111745,-118.113491/unit/mi
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude or longitude int he format lat, lng',
        400
      )
    );
  }
  // console.log(distance, lat, lng, unit);
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude or longitude int he format lat, lng',
        400
      )
    );
  }
  // console.log(distance, lat, lng, unit);

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    },
  });
});
