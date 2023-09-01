const express = require('express');

// const { protect, restrictTo } = require('./../controllers/authController');
const authController = require('./../controllers/authController');

// const {
//   getAllTours,
//   createTour,
//   getTour,
//   updateTour,
//   deleteTour,
//   aliasTopTours,
//   getTourStats,
//   getMonthlyPlan,
//   // checkID,
//   // checkBody,
// } = require('./../controllers/tourController');
const tourController = require('./../controllers/tourController');

// const reviewController = require('./../controllers/reviewController');

const reviewRouter = require('./../routes/reviewRoutes');

const router = express.Router();
// router.param('id', (req, res, next, val) => {
//   console.log(`Tour id is: ${val}`)
//   next()
// })

// router.param('id', checkID);

// router
//   .route('/:tourId/reviews')
//   .post(
//     authController.protect,
//     authController.restrictTo('user'),
//     reviewController.createReview
//   );
router.use('/:tourId/reviews', reviewRouter);

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);

router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );

// /tours-within/:distance/center/:latlng/unit/:unit
// /tours-within/233/center/34.111745,-118.113491/unit/mi
router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

// create a checkBody middleware
// check if body contains the name and price property,
// if not, send back 400(bad request)
// add it to the post handler stack
router.route('/').get(tourController.getAllTours).post(
  // checkBody,
  authController.protect,
  authController.restrictTo('admin', 'lead-guide'),
  tourController.createTour
);

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

module.exports = router;
