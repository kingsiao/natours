const express = require('express');
// const {
//   getAllUsers,
//   getUser,
//   createUser,
//   updateUser,
//   deleteUser,
//   updateMe,
//   deleteMe,
//   getMe,
//   getUser,
// } = require('./../controllers/userController');
const userController = require('./../controllers/userController');

// const {
//   signup,
//   login,
//   protect,
//   forgotPassword,
//   resetPassword,
//   updatePassword,
// } = require('./../controllers/authController');
const authController = require('./../controllers/authController');

// const reviewController = require('./../controllers/reviewController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

router.use(authController.protect);

router.patch('/updateMyPassword', authController.updatePassword);
router.get('/me', userController.getMe, userController.getUser);
router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.updateMe,
  userController.resizeUserPhoto
);
router.delete('/deleteMe', userController.deleteMe);

router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
