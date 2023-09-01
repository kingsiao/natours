// const fs = require('fs')
const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const cors = require('cors');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');

const app = express();

app.enable('trust proxy');

app.use(cors());
app.options('*', cors());
// app.options('/api/v1/tours/:id', cors());

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// middleware

// to access the html file in the browser, serving static files
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));

app.use(helmet()); // security HTTP headers

// console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === 'development') {
  // development logging
  app.use(morgan('dev'));
}

const limiter = rateLimit({
  // limit request from the same API
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request from this IP. Please try again in an hour!',
});
app.use('/api', limiter);

app.use(express.json({ limit: '10kb' })); //body parser, reading data from body into req,body
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// data sanitization against noSQL query injection
app.use(mongoSanitize());

// data sanitization against XSS
app.use(xss());

// prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

app.use(compression());

//test middleware
// app.use((req, res, next) => {
//   console.log('Hello from the middleware');
//   next();
// });

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(cookieParser);

  next();
});

// app.get('/', (req, res) => {
//   res
//     .status(200)
//     .json({
//       message: 'Hello from the server side!',
//       app: 'Natours'
//     })
// })

// app.post('/', (req, res) => {
//   res.send('You can post to this endpoint...')
// })

// // route handlers
// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`)
// )

// const getAllTours = (req, res) => {
//   console.log(req.requestTime)

//   res
//     .status(200)
//     .json({
//       status: 'success',
//       requestedAt: req.requestTime,
//       results: tours.length,
//       data: {
//         tours: tours
//       }
//     })
// }

// const getTour = (req, res) => {
//   console.log(req.params)
//   const id = req.params.id * 1
//   const tour = tours.find(el => el.id === id)
//   // if(id > tours.length)
//   if(!tour) {
//     return res
//       .status(404)
//       .json({
//         status: 'fail',
//         message: 'Invalid ID'
//       })
//   }
//   res
//     .status(200)
//     .json({
//       status: 'success',
//       data: {
//         tours: tour
//       }
//     })
// }

// const createTour = (req, res) => {
//   // console.log(req.body)
//   const newId = tours[tours.length - 1].id + 1
//   const newTour = Object.assign({id: newId}, req.body)
//   tours.push(newTour)
//   fs.writeFile(`${__dirname}/dev-data/data/tours-simple.json`, JSON.stringify(tours), err => {
//     res
//       .status(201)
//       .json({
//         status: 'success',
//         data: {
//           tour: newTour
//         }
//       })
//   })
// }

// const updateTour = (req, res) => {
//   if(req.params.id * 1 > tours.length) {
//     return res
//       .status(404)
//       .json({
//         status: 'fail',
//         message: 'Invalid ID'
//       })
//   }
//   res
//     .status(200)
//     .json({
//       status: 'success',
//       data: {
//         tour: 'Updated tour here...'
//       }
//     })
// }

// const deleteTour = (req, res) => {
//   if(req.params.id * 1 > tours.length) {
//     return res
//       .status(404)
//       .json({
//         status: 'fail',
//         message: 'Invalid ID'
//       })
//   }
//   res
//     .status(204)
//     .json({
//       status: 'success',
//       data: null
//     })
// }

// const getAllUsers = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'This route is undefined'
//   })
// }

// const getUser = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'This route is undefined'
//   })
// }

// const createUser = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'This route is undefined'
//   })
// }

// const updateUser = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'This route is undefined'
//   })
// }

// const deleteUser = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'This route is undefined'
//   })
// }

// routes
// app.get('/api/v1/tours', getAllTours)
// app.get('/api/v1/tours/:id', getTour)
// app.post('/api/v1/tours', createTour)
// app.patch('/api/v1/tours/:id', updateTour)
// app.delete('/api/v1/tours/:id', deleteTour)

// const tourRouter = express.Router()
// const userRouter = express.Router()

// tourRouter
//   .route('/')
//     .get(getAllTours)
//     .post(createTour)

// tourRouter
//   .route('/:id')
//     .get(getTour)
//     .patch(updateTour)
//     .delete(deleteTour)

// userRouter
//   .route('/')
//     .get(getAllUsers)
//     .post(createUser)

// userRouter
//   .route('/:id')
//     .get(getUser)
//     .patch(updateUser)
//     .delete(deleteUser)

// app.get('/', (req, res) => {
//   res.status(200).render('base', {
//     tour: 'The Forest Hiker',
//     user: 'jonas',
//   });
// });

// app.get('/overview', (req, res) => {
//   res.status(200).render('overview', {
//     title: 'All Tours',
//   });
// });

// app.get('/tour', (req, res) => {
//   res.status(200).render('tour', {
//     title: 'The Forest Hiker Tour',
//   });
// });

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Can't find ${req.originalUrl} on this server`,
  // });

  // const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  // err.status = 'fail';
  // err.statusCode = 404;
  // next(err);

  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

// start server
// const port = 3000
// app.listen(port, () => {
//   console.log(`App running on the port ${port}...`)
// })

module.exports = app;
