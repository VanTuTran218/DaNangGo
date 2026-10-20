import { connectDB, getPool, closeDB, sql } from '../config/db';
import { createPlaceCommon } from '../modules/places/places.service';
import { recalculateRestaurantPriceRange } from '../modules/menu-items/menu-items.repository';

interface SeedRestaurant {
  name: string;
  description: string;
  address: string;
  district_name: string;
  cuisine_name: string;
  latitude: number;
  longitude: number;
  phone: string;
  website: string;
  booking_url: string;
  promo_label: string;
  avg_rating: number;
  review_count: number;
  view_count: number;
  cover_image: string;
  gallery_images: string[];
  open_time: string;
  close_time: string;
  menu: {
    name: string;
    description: string;
    price: number;
    image_url: string;
    taste_names: string[];
  }[];
}

interface SeedAttraction {
  name: string;
  description: string;
  address: string;
  district_name: string;
  category_name: string;
  latitude: number;
  longitude: number;
  phone: string;
  website: string;
  booking_url: string;
  promo_label: string;
  ticket_price: number;
  visit_duration_minutes: number;
  avg_rating: number;
  review_count: number;
  view_count: number;
  cover_image: string;
  gallery_images: string[];
  open_time: string;
  close_time: string;
}

const SEED_RESTAURANTS: SeedRestaurant[] = [
  {
    name: 'Hải Sản Tươi Sống Mỹ Khê',
    description: 'Nhà hàng hải sản uy tín bậc nhất ven biển Mỹ Khê, hải sản tươi sống bắt trực tiếp từ hồ kính, chế biến theo phong vị miền Trung đậm đà.',
    address: '280 Đường Võ Nguyên Giáp, Phước Mỹ',
    district_name: 'Ngũ Hành Sơn',
    cuisine_name: 'Hải sản',
    latitude: 16.0594,
    longitude: 108.2443,
    phone: '02363999888',
    website: 'https://haisanmykhe.dananggo.vn',
    booking_url: 'https://dananggo.vn/dat-ban/hai-san-my-khe',
    promo_label: 'Hải sản tươi sống',
    avg_rating: 4.8,
    review_count: 1250,
    view_count: 3200,
    cover_image: 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=1200&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&q=80',
      'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=1200&q=80',
      'https://images.unsplash.com/photo-1579631542720-3a87824fff86?w=1200&q=80'
    ],
    open_time: '09:00:00',
    close_time: '23:30:00',
    menu: [
      {
        name: 'Tôm Hùm Bông Nướng Bơ Tỏi',
        description: 'Tôm hùm bông tươi sống nướng sốt bơ tỏi thơm lừng, thịt tôm ngọt dai, béo ngậy.',
        price: 350000,
        image_url: 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=800&q=80',
        taste_names: ['Béo', 'Mặn', 'Cay']
      },
      {
        name: 'Cua Huỳnh Đế Hấp Sả Gừng',
        description: 'Cua huỳnh đế thượng hạng thịt chắc nịch hấp cùng sả cây và gừng non, chấm muối tiêu chanh.',
        price: 280000,
        image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80',
        taste_names: ['Thanh đạm', 'Ngọt']
      },
      {
        name: 'Mực Trứng Hấp Hành Gừng',
        description: 'Mực cơm đầy trứng hấp vừa chín tới giòn sần sật, giữ trọn vị ngọt tự nhiên của biển cả.',
        price: 150000,
        image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80',
        taste_names: ['Thanh đạm', 'Cay']
      },
      {
        name: 'Sò Điệp Nướng Mỡ Hành Đậu Phộng',
        description: 'Sò điệp cùi dày nướng mỡ hành thơm nức mũi rắc đậu phộng rang giòn rụm.',
        price: 95000,
        image_url: 'https://images.unsplash.com/photo-1579631542720-3a87824fff86?w=800&q=80',
        taste_names: ['Béo', 'Mặn']
      }
    ]
  },
  {
    name: 'Bánh Xèo Bà Dưỡng',
    description: 'Quán bánh xèo nem lụi trứ danh hơn 30 năm tại Đà Nẵng, vỏ bánh vàng ươm giòn rụm cùng nước chấm gan heo béo bùi độc nhất vô nhị.',
    address: 'K280/23 Hoàng Diệu, Bình Hiên',
    district_name: 'Hải Châu',
    cuisine_name: 'Bánh xèo',
    latitude: 16.0612,
    longitude: 108.2175,
    phone: '02363873168',
    website: 'https://banhxeobaduong.vn',
    booking_url: 'https://dananggo.vn/dat-ban/banh-xeo-ba-duong',
    promo_label: 'Đặc sản số 1',
    avg_rating: 4.9,
    review_count: 2450,
    view_count: 4800,
    cover_image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80',
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200&q=80'
    ],
    open_time: '09:30:00',
    close_time: '21:30:00',
    menu: [
      {
        name: 'Bánh Xèo Tôm Thịt Đặc Biệt',
        description: 'Bánh xèo vỏ giòn rụm, nhân tôm đất tươi sống, thịt ba chỉ và giá đỗ tươi giòn.',
        price: 65000,
        image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
        taste_names: ['Béo', 'Mặn', 'Ngọt']
      },
      {
        name: 'Nem Lụi Nướng Than Hoa',
        description: 'Nem lụi xiên sả nướng trên than hồng thơm lừng, cuộn bánh tráng và rau rừng thanh mát.',
        price: 60000,
        image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
        taste_names: ['Mặn', 'Béo']
      },
      {
        name: 'Bò Cuộn Lá Lốt Nướng',
        description: 'Bò băm tẩm ướp tiêu rừng cuộn lá lốt nướng xém cạnh thơm phức chấm tương gan ngậy bùi.',
        price: 75000,
        image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
        taste_names: ['Béo', 'Cay']
      }
    ]
  },
  {
    name: 'Mì Quảng 1A Hải Phòng',
    description: 'Địa chỉ thưởng thức Mì Quảng truyền thống lâu đời của người dân xứ Quảng, nước nhưn sánh đậm đà kèm bánh tráng mè nướng giòn.',
    address: 'Số 1A Hải Phòng, Thạch Thang',
    district_name: 'Hải Châu',
    cuisine_name: 'Mì Quảng',
    latitude: 16.0734,
    longitude: 108.2201,
    phone: '02363827936',
    website: 'https://miquang1a.com',
    booking_url: 'https://dananggo.vn/dat-ban/mi-quang-1a',
    promo_label: 'Mì Quảng gia truyền',
    avg_rating: 4.7,
    review_count: 1560,
    view_count: 3100,
    cover_image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=1200&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=1200&q=80'
    ],
    open_time: '06:00:00',
    close_time: '21:00:00',
    menu: [
      {
        name: 'Mì Quảng Tôm Thịt Trứng Cút',
        description: 'Mì Quảng sợi mềm dai, tôm đồng rim mặn ngọt, thịt ba chỉ đậm vị và trứng cút bùi ngậy.',
        price: 45000,
        image_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
        taste_names: ['Mặn', 'Ngọt', 'Béo']
      },
      {
        name: 'Mì Quảng Ếch Đồng Thố Đất',
        description: 'Ếch đồng tươi om sả nghệ trong thố đất nghi ngút khói, ăn kèm sợi mì vàng ươm.',
        price: 55000,
        image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80',
        taste_names: ['Cay', 'Mặn', 'Đậm đà']
      },
      {
        name: 'Mì Quảng Gà Ta Rút Xương',
        description: 'Gà ta thả vườn thịt chắc ngọt rim nước mắm cốt nhĩ đậm đà đúng chất Quảng Nam - Đà Nẵng.',
        price: 50000,
        image_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
        taste_names: ['Mặn', 'Béo']
      }
    ]
  },
  {
    name: 'Cơm Niêu Nhà Đỏ Đà Nẵng',
    description: 'Không gian ấm cúng gợi nhớ hương vị bữa cơm gia đình truyền thống miền Trung với cơm niêu đập giòn tan cùng cá bống kho tiêu, canh cua rau đay.',
    address: '86 Nguyễn Tri Phương, Chính Gián',
    district_name: 'Thanh Khê',
    cuisine_name: 'Cơm nhà',
    latitude: 16.0645,
    longitude: 108.2045,
    phone: '0905123456',
    website: 'https://comnieunhado.dananggo.vn',
    booking_url: 'https://dananggo.vn/dat-ban/com-nieu-nha-do',
    promo_label: 'Ẩm thực gia đình',
    avg_rating: 4.6,
    review_count: 890,
    view_count: 2100,
    cover_image: 'https://images.unsplash.com/photo-1543353071-873f17a7a088?w=1200&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&q=80'
    ],
    open_time: '10:00:00',
    close_time: '22:00:00',
    menu: [
      {
        name: 'Cơm Niêu Cháy Giòn Rụm',
        description: 'Cơm nấu niêu đất cổ truyền, lớp cháy đáy vàng ươm giòn tan rưới mỡ hành thơm nức.',
        price: 35000,
        image_url: 'https://images.unsplash.com/photo-1543353071-873f17a7a088?w=800&q=80',
        taste_names: ['Béo', 'Thanh đạm']
      },
      {
        name: 'Cá Bống Sông Trà Kho Tộ',
        description: 'Cá bống tươi kho tộ đất đẫm tiêu rừng, nước sốt sánh kẹo cay nồng ăn cùng cơm nóng.',
        price: 95000,
        image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
        taste_names: ['Mặn', 'Cay', 'Ngọt']
      },
      {
        name: 'Canh Cua Đồng Nấu Rau Mồng Tơi Mướp Hương',
        description: 'Canh cua đồng giã tay nhiều gạch ngọt mát tự nhiên giải nhiệt ngày hè biển.',
        price: 60000,
        image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80',
        taste_names: ['Thanh đạm', 'Ngọt']
      }
    ]
  },
  {
    name: 'Bún Chả Cá Hờn',
    description: 'Thương hiệu bún chả cá lâu năm nổi danh xứ Đà với nước dùng nấu từ bí đỏ, cà chua và bắp ngọt lịm, chả cá thu dai giòn thơm nức.',
    address: '113/3 Nguyễn Chí Thanh, Hải Châu 1',
    district_name: 'Hải Châu',
    cuisine_name: 'Bún chả cá',
    latitude: 16.0712,
    longitude: 108.2223,
    phone: '02363824567',
    website: 'https://bunchacahon.vn',
    booking_url: 'https://dananggo.vn/dat-ban/bun-cha-ca-hon',
    promo_label: 'Bún chả cá trứ danh',
    avg_rating: 4.8,
    review_count: 1780,
    view_count: 3600,
    cover_image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=1200&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=1200&q=80'
    ],
    open_time: '06:00:00',
    close_time: '22:00:00',
    menu: [
      {
        name: 'Bún Chả Cá Thu Đặc Biệt',
        description: 'Tô bún đầy đặn miếng chả cá thu chiên và hấp dai giòn, nước dùng trong ngọt thanh.',
        price: 45000,
        image_url: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800&q=80',
        taste_names: ['Thanh đạm', 'Mặn', 'Chua']
      },
      {
        name: 'Bún Cá Ngừ Đại Dương',
        description: 'Cá ngừ tươi cắt khúc kho đậm đà thơm ngát hương dứa và cà chua ăn kèm ớt xanh giòn rụm.',
        price: 40000,
        image_url: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=800&q=80',
        taste_names: ['Mặn', 'Cay', 'Chua']
      }
    ]
  },
  {
    name: 'Hải Sản Bé Mặn',
    description: 'Quán hải sản bình dân đông đúc nhất dọc bãi biển Sơn Trà, thực khách tự tay lựa chọn hải sản tươi rói vừa cập bến từ ghe tàu.',
    address: 'Lô 11 Võ Nguyên Giáp, Mạn Thái',
    district_name: 'Sơn Trà',
    cuisine_name: 'Hải sản',
    latitude: 16.0825,
    longitude: 108.2435,
    phone: '0905252525',
    website: 'https://haisanbeman.vn',
    booking_url: 'https://dananggo.vn/dat-ban/hai-san-be-man',
    promo_label: 'Hải sản bình dân',
    avg_rating: 4.7,
    review_count: 2890,
    view_count: 5200,
    cover_image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=1200&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1559847844-5315695dadae?w=1200&q=80'
    ],
    open_time: '09:00:00',
    close_time: '23:59:00',
    menu: [
      {
        name: 'Chip Chip Hấp Sả Ớt',
        description: 'Nghêu chip chip Đà Nẵng béo múp hấp sả ớt nước ngọt lịm cay ấm nồng.',
        price: 70000,
        image_url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&q=80',
        taste_names: ['Cay', 'Thanh đạm']
      },
      {
        name: 'Mực Lá Nướng Sa Tế',
        description: 'Mực lá dày mình ướp sa tế tôm cay nồng nướng than hoa vàng rộm xèo xèo.',
        price: 180000,
        image_url: 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=800&q=80',
        taste_names: ['Cay', 'Mặn']
      }
    ]
  }
];

const SEED_ATTRACTIONS: SeedAttraction[] = [
  {
    name: 'Sun World Bà Nà Hills',
    description: 'Thiên đường nghỉ dưỡng và vui chơi giải trí trên đỉnh núi Chúa ở độ cao 1.487m. Nổi tiếng với Cầu Vàng bàn tay khổng lồ, Làng Pháp cổ kính và tuyến cáp treo đạt nhiều kỷ lục thế giới.',
    address: 'Tuyến cáp treo Bà Nà - Suối Mơ, Thôn An Sơn, Hòa Ninh',
    district_name: 'Hòa Vang',
    category_name: 'Giải trí',
    latitude: 15.9988,
    longitude: 107.9881,
    phone: '02363791999',
    website: 'https://banahills.sunworld.vn',
    booking_url: 'https://dananggo.vn/ve/ba-na-hills',
    promo_label: 'Biểu tượng du lịch',
    ticket_price: 900000,
    visit_duration_minutes: 360,
    avg_rating: 4.8,
    review_count: 3450,
    view_count: 8900,
    cover_image: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1200&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1528127269322-539801943592?w=1200&q=80',
      'https://images.unsplash.com/photo-1570789210967-2cac24afeb00?w=1200&q=80'
    ],
    open_time: '07:30:00',
    close_time: '19:00:00'
  },
  {
    name: 'Bán Đảo Sơn Trà & Chùa Linh Ứng',
    description: 'Khu bảo tồn thiên nhiên đa dạng với tượng Phật Bà Quan Âm cao 67m hướng nhìn ra biển Đông, đỉnh Bàn Cờ huyền thoại và bãi biển nguyên sơ bao quanh.',
    address: 'Bán đảo Sơn Trà, Phường Thọ Quang',
    district_name: 'Sơn Trà',
    category_name: 'Chùa / Tâm linh',
    latitude: 16.1008,
    longitude: 108.2774,
    phone: '02363935567',
    website: 'https://sontra.danang.gov.vn',
    booking_url: 'https://dananggo.vn/tour/ban-dao-son-tra',
    promo_label: 'Lá phổi xanh Đà Nẵng',
    ticket_price: 0,
    visit_duration_minutes: 180,
    avg_rating: 4.9,
    review_count: 2980,
    view_count: 7600,
    cover_image: 'https://images.unsplash.com/photo-1570789210967-2cac24afeb00?w=1200&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1200&q=80'
    ],
    open_time: '06:00:00',
    close_time: '18:30:00'
  },
  {
    name: 'Danh Thắng Ngũ Hành Sơn',
    description: 'Quần thể 5 ngọn núi đá vôi kỳ vĩ gắn liền với truyền thuyết ngũ hành (Kim, Mộc, Thủy, Hỏa, Thổ), lưu giữ hệ thống hang động huyền ảo, chùa chiền cổ kính và làng nghề đá mỹ nghệ Non Nước.',
    address: '81 Huyền Trân Công Chúa, Hòa Hải',
    district_name: 'Ngũ Hành Sơn',
    category_name: 'Văn hóa / Lịch sử',
    latitude: 16.0044,
    longitude: 108.2635,
    phone: '02363961114',
    website: 'https://nguhanhson.danang.gov.vn',
    booking_url: 'https://dananggo.vn/ve/ngu-hanh-son',
    promo_label: 'Di tích quốc gia đặc biệt',
    ticket_price: 40000,
    visit_duration_minutes: 120,
    avg_rating: 4.6,
    review_count: 1890,
    view_count: 5100,
    cover_image: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=1200&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1200&q=80'
    ],
    open_time: '07:00:00',
    close_time: '17:30:00'
  },
  {
    name: 'Cầu Rồng & Cầu Tình Yêu Đà Nẵng',
    description: 'Cây cầu bắc qua sông Hàn có kiến trúc độc đáo mô phỏng con rồng thời Lý vươn mình ra biển lớn. Trở thành tâm điểm lễ hội với màn phun lửa và phun nước rực rỡ vào mỗi tối cuối tuần.',
    address: 'Đường Nguyễn Văn Linh nối dài Trần Hưng Đạo',
    district_name: 'Hải Châu',
    category_name: 'Văn hóa / Lịch sử',
    latitude: 16.0611,
    longitude: 108.2272,
    phone: '02363822288',
    website: 'https://danangfantasticity.com/cau-rong',
    booking_url: 'https://dananggo.vn/diem-den/cau-rong',
    promo_label: 'Biểu tượng thành phố',
    ticket_price: 0,
    visit_duration_minutes: 60,
    avg_rating: 4.8,
    review_count: 4200,
    view_count: 9800,
    cover_image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1200&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1200&q=80'
    ],
    open_time: '00:00:00',
    close_time: '23:59:00'
  },
  {
    name: 'Bảo Tàng Điêu Khắc Chăm Đà Nẵng',
    description: 'Bảo tàng lưu giữ bộ sưu tập hiện vật nghệ thuật điêu khắc Champa quy mô lớn nhất thế giới, thành lập từ năm 1919 mang đậm dấu ấn kiến trúc Gothic hòa quyện nét đền tháp Chăm.',
    address: 'Số 02 Đường 2 Tháng 9, Bình Hiên',
    district_name: 'Hải Châu',
    category_name: 'Văn hóa / Lịch sử',
    latitude: 16.0597,
    longitude: 108.2236,
    phone: '02363821039',
    website: 'https://chammuseum.vn',
    booking_url: 'https://dananggo.vn/ve/bao-tang-cham',
    promo_label: 'Di sản thế giới',
    ticket_price: 60000,
    visit_duration_minutes: 90,
    avg_rating: 4.5,
    review_count: 980,
    view_count: 2400,
    cover_image: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=1200&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1528127269322-539801943592?w=1200&q=80'
    ],
    open_time: '07:30:00',
    close_time: '17:00:00'
  },
  {
    name: 'Bãi Biển Mỹ Khê',
    description: 'Bãi biển từng được tạp chí Forbes bình chọn là một trong những bãi biển quyến rũ nhất hành tinh với bờ cát trắng mịn thoai thoải, làn nước trong xanh ấm áp quanh năm.',
    address: 'Đường Võ Nguyên Giáp, Phước Mỹ',
    district_name: 'Sơn Trà',
    category_name: 'Bãi biển',
    latitude: 16.0683,
    longitude: 108.2468,
    phone: '02363999111',
    website: 'https://danangfantasticity.com/bien-my-khe',
    booking_url: 'https://dananggo.vn/diem-den/bien-my-khe',
    promo_label: 'Top bãi biển thế giới',
    ticket_price: 0,
    visit_duration_minutes: 120,
    avg_rating: 4.9,
    review_count: 5120,
    view_count: 12500,
    cover_image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&q=80'
    ],
    open_time: '00:00:00',
    close_time: '23:59:00'
  }
];

export async function runTask7Seed() {
  console.log('🚀 BẮT ĐẦU NẠP DỮ LIỆU MẪU CHUẨN TASK 7 CHO DANANGGO...');
  await connectDB();
  const pool = getPool();

  // 1. Lấy map ID các bảng danh mục
  const distRes = await pool.request().query<{ district_id: number; name: string }>('SELECT district_id, name FROM districts');
  const districtMap = new Map<string, number>(distRes.recordset.map((r) => [r.name.trim().toLowerCase(), r.district_id]));

  const cuisRes = await pool.request().query<{ cuisine_id: number; name: string }>('SELECT cuisine_id, name FROM cuisines');
  const cuisineMap = new Map<string, number>(cuisRes.recordset.map((r) => [r.name.trim().toLowerCase(), r.cuisine_id]));

  const tasteRes = await pool.request().query<{ taste_id: number; name: string }>('SELECT taste_id, name FROM tastes');
  const tasteMap = new Map<string, number>(tasteRes.recordset.map((r) => [r.name.trim().toLowerCase(), r.taste_id]));

  const catRes = await pool.request().query<{ category_id: number; name: string }>('SELECT category_id, name FROM attraction_categories');
  const categoryMap = new Map<string, number>(catRes.recordset.map((r) => [r.name.trim().toLowerCase(), r.category_id]));

  console.log(`📋 Đã tải danh mục: ${districtMap.size} quận, ${cuisineMap.size} loại ẩm thực, ${tasteMap.size} khẩu vị, ${categoryMap.size} loại điểm du lịch.`);

  // 2. Nạp hoặc cập nhật Nhà hàng (Restaurants)
  console.log('\n--- 🍜 ĐANG NẠP DỮ LIỆU NHÀ HÀNG & THỰC ĐƠN ---');
  for (const r of SEED_RESTAURANTS) {
    const districtId = districtMap.get(r.district_name.trim().toLowerCase()) ?? 1;
    const cuisineId = cuisineMap.get(r.cuisine_name.trim().toLowerCase()) ?? 1;

    // Kiểm tra đã có quán chưa
    const checkRes = await pool.request().input('name', sql.NVarChar(200), r.name).query<{ place_id: number }>(`
      SELECT place_id FROM places WHERE name = @name AND place_type = 'RESTAURANT'
    `);

    let placeId: number;

    if (checkRes.recordset.length > 0) {
      placeId = checkRes.recordset[0].place_id;
      // Cập nhật thông tin chi tiết
      await pool.request()
        .input('place_id', sql.Int, placeId)
        .input('description', sql.NVarChar(sql.MAX), r.description)
        .input('address', sql.NVarChar(255), r.address)
        .input('district_id', sql.Int, districtId)
        .input('latitude', sql.Decimal(9, 6), r.latitude)
        .input('longitude', sql.Decimal(9, 6), r.longitude)
        .input('phone', sql.VarChar(20), r.phone)
        .input('website', sql.VarChar(255), r.website)
        .input('booking_url', sql.NVarChar(500), r.booking_url)
        .input('promo_label', sql.NVarChar(50), r.promo_label)
        .input('avg_rating', sql.Decimal(3, 2), r.avg_rating)
        .input('review_count', sql.Int, r.review_count)
        .input('view_count', sql.Int, r.view_count)
        .query(`
          UPDATE places SET
            description = @description, address = @address, district_id = @district_id,
            latitude = @latitude, longitude = @longitude, phone = @phone, website = @website,
            booking_url = @booking_url, promo_label = @promo_label, avg_rating = @avg_rating,
            review_count = @review_count, view_count = @view_count, updated_at = GETDATE()
          WHERE place_id = @place_id
        `);

      // Cập nhật cuisine_id
      await pool.request()
        .input('place_id', sql.Int, placeId)
        .input('cuisine_id', sql.Int, cuisineId)
        .query('UPDATE restaurants SET cuisine_id = @cuisine_id WHERE place_id = @place_id');

      console.log(`  [Cập nhật] Nhà hàng: ${r.name} (place_id: ${placeId})`);
    } else {
      // Dùng hàm createPlaceCommon dùng chung
      placeId = await createPlaceCommon({
        place_type: 'RESTAURANT',
        name: r.name,
        description: r.description,
        address: r.address,
        district_id: districtId,
        latitude: r.latitude,
        longitude: r.longitude,
        phone: r.phone,
        website: r.website,
        booking_url: r.booking_url,
        promo_label: r.promo_label,
        status: 'ACTIVE'
      });

      // Insert vào restaurants
      await pool.request()
        .input('place_id', sql.Int, placeId)
        .input('cuisine_id', sql.Int, cuisineId)
        .query(`
          INSERT INTO restaurants (place_id, place_type, cuisine_id, price_min, price_max)
          VALUES (@place_id, 'RESTAURANT', @cuisine_id, NULL, NULL)
        `);

      // Cập nhật rating và view_count mẫu
      await pool.request()
        .input('place_id', sql.Int, placeId)
        .input('avg_rating', sql.Decimal(3, 2), r.avg_rating)
        .input('review_count', sql.Int, r.review_count)
        .input('view_count', sql.Int, r.view_count)
        .query('UPDATE places SET avg_rating = @avg_rating, review_count = @review_count, view_count = @view_count WHERE place_id = @place_id');

      console.log(`  [Thêm mới] Nhà hàng: ${r.name} (place_id: ${placeId})`);
    }

    // Nạp lịch mở cửa (Cả tuần từ Thứ 2 = 2 đến Chủ nhật = 1)
    await pool.request().input('place_id', sql.Int, placeId).query('DELETE FROM opening_hours WHERE place_id = @place_id');
    for (let day = 1; day <= 7; day++) {
      await pool.request()
        .input('place_id', sql.Int, placeId)
        .input('day_of_week', sql.TinyInt, day)
        .input('open_time', sql.VarChar(10), r.open_time)
        .input('close_time', sql.VarChar(10), r.close_time)
        .query(`
          INSERT INTO opening_hours (place_id, day_of_week, open_time, close_time)
          VALUES (@place_id, @day_of_week, @open_time, @close_time)
        `);
    }

    // Nạp thư viện ảnh (Ảnh bìa + ảnh gallery)
    await pool.request().input('place_id', sql.Int, placeId).query('DELETE FROM place_images WHERE place_id = @place_id');
    // Ảnh bìa
    await pool.request()
      .input('place_id', sql.Int, placeId)
      .input('image_url', sql.VarChar(sql.MAX), r.cover_image)
      .input('is_cover', sql.Bit, 1)
      .query('INSERT INTO place_images (place_id, image_url, is_cover) VALUES (@place_id, @image_url, @is_cover)');

    // Ảnh phụ
    for (const img of r.gallery_images) {
      await pool.request()
        .input('place_id', sql.Int, placeId)
        .input('image_url', sql.VarChar(sql.MAX), img)
        .input('is_cover', sql.Bit, 0)
        .query('INSERT INTO place_images (place_id, image_url, is_cover) VALUES (@place_id, @image_url, @is_cover)');
    }

    // Nạp thực đơn món ăn (menu_items)
    for (const item of r.menu) {
      const itemCheck = await pool.request()
        .input('place_id', sql.Int, placeId)
        .input('name', sql.NVarChar(100), item.name)
        .query<{ menu_item_id: number }>('SELECT menu_item_id FROM menu_items WHERE place_id = @place_id AND name = @name');

      let menuItemId: number;

      if (itemCheck.recordset.length > 0) {
        menuItemId = itemCheck.recordset[0].menu_item_id;
        await pool.request()
          .input('item_id', sql.Int, menuItemId)
          .input('description', sql.NVarChar(255), item.description)
          .input('price', sql.Decimal(18, 0), item.price)
          .input('image_url', sql.VarChar(sql.MAX), item.image_url)
          .query('UPDATE menu_items SET description = @description, price = @price, image_url = @image_url, is_available = 1 WHERE menu_item_id = @item_id');
      } else {
        const insertItem = await pool.request()
          .input('place_id', sql.Int, placeId)
          .input('name', sql.NVarChar(100), item.name)
          .input('description', sql.NVarChar(255), item.description)
          .input('price', sql.Decimal(18, 0), item.price)
          .input('image_url', sql.VarChar(sql.MAX), item.image_url)
          .query<{ menu_item_id: number }>(`
            INSERT INTO menu_items (place_id, name, description, price, image_url, is_available)
            OUTPUT INSERTED.menu_item_id
            VALUES (@place_id, @name, @description, @price, @image_url, 1)
          `);
        menuItemId = insertItem.recordset[0].menu_item_id;
      }

      // Gắn khẩu vị cho món
      await pool.request().input('item_id', sql.Int, menuItemId).query('DELETE FROM menu_item_tastes WHERE menu_item_id = @item_id');
      for (const tName of item.taste_names) {
        const tId = tasteMap.get(tName.trim().toLowerCase());
        if (tId) {
          await pool.request()
            .input('item_id', sql.Int, menuItemId)
            .input('taste_id', sql.Int, tId)
            .query('INSERT INTO menu_item_tastes (menu_item_id, taste_id) VALUES (@item_id, @taste_id)');
        }
      }
    }

    // Tự động tính lại khoảng giá price_min / price_max cho nhà hàng
    await recalculateRestaurantPriceRange(placeId);
  }

  // 3. Nạp hoặc cập nhật Điểm du lịch (Attractions)
  console.log('\n--- 🏖️ ĐANG NẠP DỮ LIỆU ĐIỂM DU LỊCH ---');
  for (const a of SEED_ATTRACTIONS) {
    const districtId = districtMap.get(a.district_name.trim().toLowerCase()) ?? 1;
    const categoryId = categoryMap.get(a.category_name.trim().toLowerCase()) ?? 1;

    // Kiểm tra đã có điểm chưa
    const checkRes = await pool.request().input('name', sql.NVarChar(200), a.name).query<{ place_id: number }>(`
      SELECT place_id FROM places WHERE name = @name AND place_type = 'ATTRACTION'
    `);

    let placeId: number;

    if (checkRes.recordset.length > 0) {
      placeId = checkRes.recordset[0].place_id;
      await pool.request()
        .input('place_id', sql.Int, placeId)
        .input('description', sql.NVarChar(sql.MAX), a.description)
        .input('address', sql.NVarChar(255), a.address)
        .input('district_id', sql.Int, districtId)
        .input('latitude', sql.Decimal(9, 6), a.latitude)
        .input('longitude', sql.Decimal(9, 6), a.longitude)
        .input('phone', sql.VarChar(20), a.phone)
        .input('website', sql.VarChar(255), a.website)
        .input('booking_url', sql.NVarChar(500), a.booking_url)
        .input('promo_label', sql.NVarChar(50), a.promo_label)
        .input('avg_rating', sql.Decimal(3, 2), a.avg_rating)
        .input('review_count', sql.Int, a.review_count)
        .input('view_count', sql.Int, a.view_count)
        .query(`
          UPDATE places SET
            description = @description, address = @address, district_id = @district_id,
            latitude = @latitude, longitude = @longitude, phone = @phone, website = @website,
            booking_url = @booking_url, promo_label = @promo_label, avg_rating = @avg_rating,
            review_count = @review_count, view_count = @view_count, updated_at = GETDATE()
          WHERE place_id = @place_id
        `);

      await pool.request()
        .input('place_id', sql.Int, placeId)
        .input('category_id', sql.Int, categoryId)
        .input('ticket_price', sql.Decimal(18, 0), a.ticket_price)
        .input('visit_duration_minutes', sql.Int, a.visit_duration_minutes)
        .query(`
          UPDATE attractions SET
            category_id = @category_id, ticket_price = @ticket_price, visit_duration_minutes = @visit_duration_minutes
          WHERE place_id = @place_id
        `);

      console.log(`  [Cập nhật] Điểm du lịch: ${a.name} (place_id: ${placeId})`);
    } else {
      // Dùng hàm createPlaceCommon dùng chung
      placeId = await createPlaceCommon({
        place_type: 'ATTRACTION',
        name: a.name,
        description: a.description,
        address: a.address,
        district_id: districtId,
        latitude: a.latitude,
        longitude: a.longitude,
        phone: a.phone,
        website: a.website,
        booking_url: a.booking_url,
        promo_label: a.promo_label,
        status: 'ACTIVE'
      });

      // Insert vào attractions
      await pool.request()
        .input('place_id', sql.Int, placeId)
        .input('category_id', sql.Int, categoryId)
        .input('ticket_price', sql.Decimal(18, 0), a.ticket_price)
        .input('visit_duration_minutes', sql.Int, a.visit_duration_minutes)
        .query(`
          INSERT INTO attractions (place_id, place_type, category_id, ticket_price, visit_duration_minutes)
          VALUES (@place_id, 'ATTRACTION', @category_id, @ticket_price, @visit_duration_minutes)
        `);

      await pool.request()
        .input('place_id', sql.Int, placeId)
        .input('avg_rating', sql.Decimal(3, 2), a.avg_rating)
        .input('review_count', sql.Int, a.review_count)
        .input('view_count', sql.Int, a.view_count)
        .query('UPDATE places SET avg_rating = @avg_rating, review_count = @review_count, view_count = @view_count WHERE place_id = @place_id');

      console.log(`  [Thêm mới] Điểm du lịch: ${a.name} (place_id: ${placeId})`);
    }

    // Nạp lịch mở cửa
    await pool.request().input('place_id', sql.Int, placeId).query('DELETE FROM opening_hours WHERE place_id = @place_id');
    for (let day = 1; day <= 7; day++) {
      await pool.request()
        .input('place_id', sql.Int, placeId)
        .input('day_of_week', sql.TinyInt, day)
        .input('open_time', sql.VarChar(10), a.open_time)
        .input('close_time', sql.VarChar(10), a.close_time)
        .query(`
          INSERT INTO opening_hours (place_id, day_of_week, open_time, close_time)
          VALUES (@place_id, @day_of_week, @open_time, @close_time)
        `);
    }

    // Nạp thư viện ảnh
    await pool.request().input('place_id', sql.Int, placeId).query('DELETE FROM place_images WHERE place_id = @place_id');
    await pool.request()
      .input('place_id', sql.Int, placeId)
      .input('image_url', sql.VarChar(sql.MAX), a.cover_image)
      .input('is_cover', sql.Bit, 1)
      .query('INSERT INTO place_images (place_id, image_url, is_cover) VALUES (@place_id, @image_url, @is_cover)');

    for (const img of a.gallery_images) {
      await pool.request()
        .input('place_id', sql.Int, placeId)
        .input('image_url', sql.VarChar(sql.MAX), img)
        .input('is_cover', sql.Bit, 0)
        .query('INSERT INTO place_images (place_id, image_url, is_cover) VALUES (@place_id, @image_url, @is_cover)');
    }
  }

  // 4. Thống kê kết quả sau khi seed
  console.log('\n======================================================');
  console.log('🎉 TỔNG KẾT DỮ LIỆU ĐÃ SEED THÀNH CÔNG:');
  const countPlaces = await pool.request().query('SELECT place_type, COUNT(*) as c FROM places GROUP BY place_type');
  console.table(countPlaces.recordset);
  const countMenu = await pool.request().query('SELECT COUNT(*) as c FROM menu_items');
  const countImages = await pool.request().query('SELECT COUNT(*) as c FROM place_images');
  const countHours = await pool.request().query('SELECT COUNT(*) as c FROM opening_hours');
  console.log(`- Món ăn (menu_items): ${countMenu.recordset[0].c}`);
  console.log(`- Ảnh (place_images): ${countImages.recordset[0].c}`);
  console.log(`- Lịch mở cửa (opening_hours): ${countHours.recordset[0].c}`);
  console.log('======================================================\n');

  await closeDB();
}

if (require.main === module) {
  runTask7Seed().catch((err) => {
    console.error('Lỗi khi seed data:', err);
    process.exit(1);
  });
}
