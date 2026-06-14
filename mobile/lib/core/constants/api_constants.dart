class ApiConstants {
  const ApiConstants._();

  // For Android emulator: use 10.0.2.2:5000
  // For iOS simulator: use localhost:5000
  // For real device: use your computer's IP (e.g., 192.168.1.x:5000)
  // Production: use HTTPS URL
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:5000/api',
  );

  // Production base URL — set via --dart-define=API_BASE_URL=https://your-domain.com/api
  // Never use HTTP for production — card details and auth tokens must be encrypted
  static const String productionBaseUrl = 'https://your-domain.com/api';

  static const Duration connectTimeout = Duration(seconds: 15);
  static const Duration receiveTimeout = Duration(seconds: 15);
  static const Duration sendTimeout = Duration(seconds: 15);

  static const int defaultPageSize = 10;
  static const int maxPageSize = 100;

  static const double freeShippingThreshold = 50.0;
  static const double shippingCost = 5.0;
  static const double taxRate = 0.1;

  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String logout = '/auth/logout';
  static const String refreshToken = '/auth/refresh-token';
  static const String me = '/auth/me';
  static const String forgotPassword = '/auth/forgot-password';
  static const String resetPassword = '/auth/reset-password';
  static const String updatePassword = '/auth/update-password';
  static const String sendVerification = '/auth/send-verification';
  static const String verifyEmail = '/auth/verify-email';

  static const String profile = '/users/profile';
  static const String avatar = '/users/avatar';
  static const String addresses = '/users/addresses';
  static const String wishlist = '/users/wishlist';
  static const String savedCard = '/users/card';
  static const String savedCardCheckout = '/users/card/checkout';

  static const String products = '/products';
  static const String featuredProducts = '/products/featured';
  static const String flashSaleProducts = '/products/flash-sale';

  static const String categories = '/categories';

  static const String cart = '/cart';

  static const String orders = '/orders';

  static const String validateCard = '/payments/validate-card';
  static const String processPayment = '/payments/process';

  static const String notifications = '/notifications';
  static const String unreadCount = '/notifications/unread-count';

  static const String reviews = '/reviews';
  static const String myReviews = '/reviews/my';
}
