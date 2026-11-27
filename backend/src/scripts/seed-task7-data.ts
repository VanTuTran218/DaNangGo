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

interface SeedAccommodation {
  name: string;
  description: string;
  address: string;
  district_name: string;
  accommodation_type: 'HOTEL' | 'HOMESTAY' | 'RESORT' | 'HOSTEL' | 'APARTMENT';
  star_rating: number;
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
  amenity_names: string[];
  rooms: {
    name: string;
    description: string;
    price_per_night: number;
    original_price: number;
    capacity: number;
    bed_type: string;
    total_rooms: number;
  }[];
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
      },
      {
        name: 'Cháo Hải Sản Hào Sữa',
        description: 'Cháo gạo rang nấu cùng hào sữa tươi, tôm sú và nấm rơm ngọt thanh ấm bụng.',
        price: 85000,
        image_url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80',
        taste_names: ['Thanh đạm', 'Ngọt']
      }
    ]
  },
  {
    name: 'Bánh Xèo Bà Ba',
    description: 'Bánh xèo miền Trung giòn rụm tráng chảo gang truyền thống, nhân tôm đất tươi và thịt ba chỉ, ăn kèm rau sống Trà Quế và nước tương đậu phộng béo bùi.',
    address: '124 Đường Trưng Nữ Vương, Bình Hiên',
    district_name: 'Hải Châu',
    cuisine_name: 'Bánh xèo',
    latitude: 16.0544,
    longitude: 108.2201,
    phone: '02363811223',
    website: 'https://banhxeobaba.dananggo.vn',
    booking_url: 'https://dananggo.vn/dat-ban/banh-xeo-ba-ba',
    promo_label: 'Bánh xèo giòn rụm',
    avg_rating: 4.5,
    review_count: 420,
    view_count: 1450,
    cover_image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=1200&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80'
    ],
    open_time: '10:00:00',
    close_time: '21:30:00',
    menu: [
      {
        name: 'Bánh Xèo Tôm Đất Chảo Gang',
        description: 'Bánh xèo vàng giòn rụm nhân tôm đất sông Hàn, thịt heo ba chỉ và giá đỗ tươi.',
        price: 50000,
        image_url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80',
        taste_names: ['Béo', 'Mặn', 'Ngọt']
      },
      {
        name: 'Bánh Xèo Hải Sản Mực Tôm',
        description: 'Bánh xèo nhân mực tươi cắt khoanh và tôm sú bóc vỏ kèm nấm kim châm giòn ngọt.',
        price: 65000,
        image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
        taste_names: ['Béo', 'Mặn']
      },
      {
        name: 'Nem Lụi Nướng Sả Cây (Phần 5 cây)',
        description: 'Thịt heo quết dẻo bọc sả cây nướng than hồng thơm lừng, cuốn bánh tráng rau sống.',
        price: 55000,
        image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
        taste_names: ['Mặn', 'Béo', 'Ngọt']
      },
      {
        name: 'Ram Bắp Giòn Xứ Quảng',
        description: 'Ram cuốn bắp non bào mỏng chiên giòn tan, chấm tương gan đậu phộng đậm đà.',
        price: 45000,
        image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
        taste_names: ['Ngọt', 'Béo']
      }
    ]
  },
  {
    name: 'Cao Lầu Hội An Giao Lưu',
    description: 'Cao lầu chuẩn phong cách Hội An ngay giữa lòng Đà Nẵng, sợi mì tro củi tràm dai giòn ăn cùng thịt xá xíu rim ngũ vị và tóp mỡ giòn tan.',
    address: '88 Đường Phạm Văn Đồng, An Hải Bắc',
    district_name: 'Sơn Trà',
    cuisine_name: 'Cao lầu',
    latitude: 16.0711,
    longitude: 108.2381,
    phone: '02363932345',
    website: 'https://caolaugiaoluu.dananggo.vn',
    booking_url: 'https://dananggo.vn/dat-ban/cao-lau-hoi-an-giao-luu',
    promo_label: 'Chuẩn vị Phố Hội',
    avg_rating: 4.6,
    review_count: 510,
    view_count: 1680,
    cover_image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=1200&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=1200&q=80'
    ],
    open_time: '06:30:00',
    close_time: '21:30:00',
    menu: [
      {
        name: 'Cao Lầu Xá Xíu Hội An Truyền Thống',
        description: 'Sợi cao lầu vàng ươm dai giòn, thịt xá xíu rim mềm thơm, da heo chiên giòn và rau Trà Quế.',
        price: 50000,
        image_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
        taste_names: ['Mặn', 'Ngọt', 'Béo']
      },
      {
        name: 'Cao Lầu Đặc Biệt Full Topping',
        description: 'Cao lầu gấp đôi thịt xá xíu, tôm rim, trứng lòng đào và bánh đa nướng giòn.',
        price: 65000,
        image_url: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800&q=80',
        taste_names: ['Mặn', 'Béo', 'Cay']
      },
      {
        name: 'Hoành Thánh Chiên Giòn Sốt Chua Ngọt',
        description: 'Hoành thánh chiên vàng giòn rưới sốt cà chua dứa tôm thịt đậm vị Hội An.',
        price: 60000,
        image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80',
        taste_names: ['Chua', 'Ngọt', 'Béo']
      },
      {
        name: 'Bánh Bao Bánh Vạc Hoa Hồng Trắng',
        description: 'Đặc sản bánh vạc nhân tôm thịt nấm mèo hấp trong suốt chấm nước mắm ớt xanh.',
        price: 55000,
        image_url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&q=80',
        taste_names: ['Thanh đạm', 'Ngọt', 'Chua']
      }
    ]
  },
  {
    name: 'Mì Hoành Thánh Tàu Bay',
    description: 'Quán mì gia truyền phong cách Hoa - Quảng tồn tại hơn 50 năm tại Đà Nẵng, sợi mì trứng tươi làm thủ công mỗi ngày.',
    address: '215 Đường Trần Cao Vân, Xuân Hà',
    district_name: 'Thanh Khê',
    cuisine_name: 'Mì Quảng',
    latitude: 16.0678,
    longitude: 108.1923,
    phone: '02363751888',
    website: 'https://mitauba.dananggo.vn',
    booking_url: 'https://dananggo.vn/dat-ban/mi-hoanh-thanh-tau-bay',
    promo_label: 'Gia truyền 50 năm',
    avg_rating: 4.5,
    review_count: 380,
    view_count: 1320,
    cover_image: 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=1200&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=1200&q=80'
    ],
    open_time: '06:00:00',
    close_time: '21:00:00',
    menu: [
      {
        name: 'Mì Hoành Thánh Xá Xíu Nước',
        description: 'Mì trứng tươi dai mềm, viên hoành thánh nhân tôm thịt đầy đặn và nước dùng xương hầm trong vắt.',
        price: 45000,
        image_url: 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=800&q=80',
        taste_names: ['Thanh đạm', 'Ngọt', 'Mặn']
      },
      {
        name: 'Mì Khô Trộn Sốt Dầu Hào Xá Xíu',
        description: 'Mì khô trộn sốt dầu hào gia truyền kèm chén súp hoành thánh nóng hổi.',
        price: 55000,
        image_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
        taste_names: ['Mặn', 'Ngọt', 'Béo']
      },
      {
        name: 'Sủi Cảo Tôm Tươi Hấp Nước Dùng',
        description: 'Sủi cảo nhân tôm sú nguyên con giòn sần sật nấu cùng cải ngọt và nấm đông cô.',
        price: 60000,
        image_url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&q=80',
        taste_names: ['Thanh đạm', 'Ngọt']
      },
      {
        name: 'Mì Quảng Gà Xá Xíu Giao Thoa',
        description: 'Sự kết hợp độc đáo giữa sợi mì Quảng và thịt xá xíu rim mật ong thơm lừng.',
        price: 50000,
        image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80',
        taste_names: ['Mặn', 'Ngọt']
      }
    ]
  },
  {
    name: 'Nhà hàng Mì Quảng Tú Quán',
    description: 'Không gian thưởng thức Mì Quảng chuẩn vị quê nhà với nước nhưn ninh từ xương ống và tôm đồng, rau sống 9 vị tươi mát.',
    address: '123 Trần Cao Vân, Hải Châu, Đà Nẵng',
    district_name: 'Hải Châu',
    cuisine_name: 'Mì Quảng',
    latitude: 16.0678,
    longitude: 108.2208,
    phone: '02363888777',
    website: 'https://miquangtuquan.dananggo.vn',
    booking_url: 'https://dananggo.vn/dat-ban/mi-quang-tu-quan',
    promo_label: 'Mì Quảng quê nhà',
    avg_rating: 4.6,
    review_count: 340,
    view_count: 1150,
    cover_image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=1200&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=1200&q=80'
    ],
    open_time: '06:00:00',
    close_time: '21:00:00',
    menu: [
      {
        name: 'Mì Quảng Sườn Non Tôm Trứng',
        description: 'Sườn non hầm mềm thấm vị, tôm đất rim đỏ au và trứng gà ta béo bùi.',
        price: 45000,
        image_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
        taste_names: ['Mặn', 'Ngọt', 'Béo']
      },
      {
        name: 'Mì Quảng Cá Lóc Đồng',
        description: 'Cá lóc đồng phi lê ướp nghệ tươi rim săn chắc, nước nhưn thơm nồng hương củ nén.',
        price: 50000,
        image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80',
        taste_names: ['Mặn', 'Cay', 'Thanh đạm']
      },
      {
        name: 'Mì Quảng Đặc Biệt Thập Cẩm',
        description: 'Tô lớn đầy đủ gà ta, tôm, thịt ba chỉ, chả lụa và bánh tráng mè nướng.',
        price: 60000,
        image_url: 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=800&q=80',
        taste_names: ['Mặn', 'Béo', 'Cay']
      },
      {
        name: 'Bánh Bèo Chén Nhân Tôm Cháy',
        description: 'Mâm 10 chén bánh bèo bột gạo mềm mịn rắc tôm cháy, tóp mỡ và mỡ hành.',
        price: 35000,
        image_url: 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=800&q=80',
        taste_names: ['Mặn', 'Ngọt', 'Béo']
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
      },
      {
        name: 'Thịt Heo Xiên Nướng Mè',
        description: 'Thịt nạc vai ướp sả mật ong và mè rang nướng than hồng mềm ngọt.',
        price: 65000,
        image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80',
        taste_names: ['Ngọt', 'Mặn', 'Béo']
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
        taste_names: ['Cay', 'Mặn']
      },
      {
        name: 'Mì Quảng Gà Ta Rút Xương',
        description: 'Gà ta thả vườn thịt chắc ngọt rim nước mắm cốt nhĩ đậm đà đúng chất Quảng Nam - Đà Nẵng.',
        price: 50000,
        image_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
        taste_names: ['Mặn', 'Béo']
      },
      {
        name: 'Bánh Tráng Thịt Heo Nhỏ',
        description: 'Đĩa thịt heo hai đầu da luộc khéo cuốn cùng rau sống và mắm nêm dứa cay nồng.',
        price: 65000,
        image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
        taste_names: ['Mặn', 'Cay', 'Chua']
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
      },
      {
        name: 'Thịt Ba Chỉ Luộc Chấm Mắm Tôm Chua',
        description: 'Thịt heo ba chỉ rút sườn luộc mềm ngọt ăn kèm cà pháo giòn và tôm chua Huế.',
        price: 85000,
        image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
        taste_names: ['Chua', 'Cay', 'Mặn']
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
      },
      {
        name: 'Bún Riêu Chả Cá Thác Lác',
        description: 'Sự hòa quyện giữa riêu cua béo ngậy và chả cá thác lác quết thì là dai sần sật.',
        price: 50000,
        image_url: 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=800&q=80',
        taste_names: ['Béo', 'Chua', 'Ngọt']
      },
      {
        name: 'Chả Cá Thu Tươi Cắt Lát (Đĩa thêm)',
        description: 'Chả cá thu nguyên chất 100% hấp nóng chấm tương ớt rim Đà Nẵng.',
        price: 35000,
        image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
        taste_names: ['Mặn', 'Cay']
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
      },
      {
        name: 'Tôm Sú Rang Muối Hồng Kông',
        description: 'Tôm sú biển vỏ giòn rụm áo lớp muối tỏi ớt thơm nồng cực bắt vị.',
        price: 195000,
        image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80',
        taste_names: ['Mặn', 'Cay', 'Béo']
      },
      {
        name: 'Ốc Hương Xào Bơ Tỏi Bánh Mì',
        description: 'Ốc hương size lớn xào sốt bơ tỏi béo ngậy chấm kèm bánh mì nóng giòn.',
        price: 165000,
        image_url: 'https://images.unsplash.com/photo-1579631542720-3a87824fff86?w=800&q=80',
        taste_names: ['Béo', 'Ngọt', 'Mặn']
      }
    ]
  },
  // --- BỔ SUNG CÁC QUÁN ẨM THỰC ĐA DẠNG ĐỦ 10 LOẠI CUISINES & MỌI NGÂN SÁCH ---
  {
    name: 'Lẩu Cá Cu Sông Hàn',
    description: 'Nhà hàng chuyên các món lẩu cá biển tươi sống đặc trưng Đà Nẵng như cá cu, cá bớp, cá mú nấu chua cay kiểu miền Trung.',
    address: '158 Trần Hưng Đạo, Nại Hiên Đông',
    district_name: 'Sơn Trà',
    cuisine_name: 'Lẩu cá',
    latitude: 16.0772,
    longitude: 108.2314,
    phone: '02363918899',
    website: 'https://laucacusonghan.dananggo.vn',
    booking_url: 'https://dananggo.vn/dat-ban/lau-ca-cu-song-han',
    promo_label: 'Đặc sản Lẩu cá biển',
    avg_rating: 4.8,
    review_count: 920,
    view_count: 2650,
    cover_image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=1200&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1559847844-5315695dadae?w=1200&q=80'
    ],
    open_time: '10:30:00',
    close_time: '23:00:00',
    menu: [
      {
        name: 'Lẩu Cá Cu Nấu Măng Chua (Nồi 2-3 người)',
        description: 'Cá cu biển thịt trắng ngọt chắc nấu cùng măng chua, cà chua, dứa và rau ngổ thơm lừng.',
        price: 220000,
        image_url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80',
        taste_names: ['Chua', 'Cay', 'Thanh đạm']
      },
      {
        name: 'Lẩu Cá Bớp Nấu Lá Giang',
        description: 'Cá bớp tươi cắt khoanh dày béo mềm hòa quyện vị chua dịu tự nhiên của lá giang rừng.',
        price: 250000,
        image_url: 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=800&q=80',
        taste_names: ['Chua', 'Cay', 'Béo']
      },
      {
        name: 'Cá Cu Nướng Muối Ớt Xanh',
        description: 'Cá cu tươi khứa mình nướng than hoa chấm muối ớt xiêm xanh cay nồng.',
        price: 145000,
        image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80',
        taste_names: ['Cay', 'Mặn']
      },
      {
        name: 'Gỏi Cá Trích Rong Biển Sơn Trà',
        description: 'Cá trích tươi trộn thính gạo, hành tây, đậu phộng và rong biển giòn mát.',
        price: 95000,
        image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
        taste_names: ['Chua', 'Cay', 'Thanh đạm']
      }
    ]
  },
  {
    name: 'Lẩu Cá Đuối & Hải Sản Nam Ô',
    description: 'Quán lẩu cá đuối bình dân sát bờ biển Nguyễn Tất Thành, nổi tiếng với nồi lẩu măng chua sụn cá đuối giòn sần sật và gỏi cá Nam Ô.',
    address: '412 Nguyễn Tất Thành, Hòa Hiệp Nam',
    district_name: 'Liên Chiểu',
    cuisine_name: 'Lẩu cá',
    latitude: 16.1085,
    longitude: 108.1362,
    phone: '0905888123',
    website: 'https://laucaduoinamo.dananggo.vn',
    booking_url: 'https://dananggo.vn/dat-ban/lau-ca-duoi-nam-o',
    promo_label: 'Lẩu cá bình dân',
    avg_rating: 4.6,
    review_count: 640,
    view_count: 1850,
    cover_image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=1200&q=80'
    ],
    open_time: '10:00:00',
    close_time: '22:30:00',
    menu: [
      {
        name: 'Lẩu Cá Đuối Măng Chua Cay',
        description: 'Cá đuối tươi sụn mềm giòn nấu măng chua, bắp chuối bào và rau muống chẻ.',
        price: 150000,
        image_url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80',
        taste_names: ['Chua', 'Cay', 'Mặn']
      },
      {
        name: 'Gỏi Cá Nam Ô Gia Truyền',
        description: 'Đặc sản gỏi cá trích làng chài Nam Ô cuốn bánh tráng, rau rừng và nước chấm mè đậu phộng.',
        price: 110000,
        image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
        taste_names: ['Cay', 'Béo', 'Chua']
      },
      {
        name: 'Cá Đuối Nướng Nghệ Tươi',
        description: 'Cá đuối ướp nghệ và sả băm nướng trên lá chuối thơm nức mũi.',
        price: 120000,
        image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80',
        taste_names: ['Mặn', 'Cay']
      },
      {
        name: 'Bún Tươi & Rau Rừng Ăn Lẩu',
        description: 'Phần bún tươi cùng rổ rau chuối, kèo nèo, rau muống ăn kèm lẩu cá.',
        price: 30000,
        image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80',
        taste_names: ['Thanh đạm']
      }
    ]
  },
  {
    name: 'Bánh Canh Ruộng Phương',
    description: 'Quán bánh canh bình dân nức tiếng Đà Nẵng dưới chân cầu Thuận Phước, sợi bánh canh bột gạo dai mềm cùng cá nướng xé tay và quẩy giòn.',
    address: 'K27/03 Hà Thị Thân, An Hải Trung',
    district_name: 'Sơn Trà',
    cuisine_name: 'Bánh canh',
    latitude: 16.0631,
    longitude: 108.2342,
    phone: '0905333444',
    website: 'https://banhcanhruong.dananggo.vn',
    booking_url: 'https://dananggo.vn/dat-ban/banh-canh-ruong-phuong',
    promo_label: 'Đặc sản bình dân',
    avg_rating: 4.7,
    review_count: 1120,
    view_count: 2950,
    cover_image: 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=1200&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=1200&q=80'
    ],
    open_time: '14:00:00',
    close_time: '22:00:00',
    menu: [
      {
        name: 'Bánh Canh Cá Nướng Chả Trứng Cút',
        description: 'Tô bánh canh bột gạo nóng hổi với cá ngừ nướng xé thơm lừng, chả cá và trứng cút.',
        price: 30000,
        image_url: 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=800&q=80',
        taste_names: ['Ngọt', 'Mặn', 'Cay']
      },
      {
        name: 'Bánh Canh Ghẹ Sữa Tươi',
        description: 'Nước dùng sánh ngọt ninh từ ghẹ sữa biển Sơn Trà, ăn kèm chả cua và hành phi.',
        price: 45000,
        image_url: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800&q=80',
        taste_names: ['Ngọt', 'Béo', 'Thanh đạm']
      },
      {
        name: 'Bánh Canh Giò Heo Chả Cá',
        description: 'Giò heo rút xương hầm mềm béo ngậy kết hợp sợi bánh canh bột lọc trong veo.',
        price: 40000,
        image_url: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=800&q=80',
        taste_names: ['Béo', 'Mặn']
      },
      {
        name: 'Bánh Quẩy Giòn Chấm Nước Bánh Canh',
        description: 'Đĩa quẩy nóng giòn tan ăn kèm bánh canh ruộng chuẩn vị người Đà Nẵng.',
        price: 15000,
        image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80',
        taste_names: ['Béo', 'Mặn']
      }
    ]
  },
  {
    name: 'Bánh Canh Cá Lóc Thanh Hương',
    description: 'Bánh canh cá lóc đồng phi lê không xương, nước dùng trong ngọt đậm hương củ nén và ớt bột chưng cay nồng ấm áp.',
    address: '130 Lê Đình Dương, Nam Dương',
    district_name: 'Hải Châu',
    cuisine_name: 'Bánh canh',
    latitude: 16.0604,
    longitude: 108.2195,
    phone: '02363829111',
    website: 'https://banhcanhthanhhuong.dananggo.vn',
    booking_url: 'https://dananggo.vn/dat-ban/banh-canh-thanh-huong',
    promo_label: 'Bánh canh cá lóc',
    avg_rating: 4.6,
    review_count: 740,
    view_count: 1920,
    cover_image: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=1200&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1555126634-323283e090fa?w=1200&q=80'
    ],
    open_time: '06:30:00',
    close_time: '21:30:00',
    menu: [
      {
        name: 'Bánh Canh Cá Lóc Phi Lê Đặc Biệt',
        description: 'Sợi bánh canh bột gạo xắt tay, cá lóc đồng um củ nén thơm nức và lòng cá giòn béo.',
        price: 45000,
        image_url: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=800&q=80',
        taste_names: ['Cay', 'Mặn', 'Thanh đạm']
      },
      {
        name: 'Bánh Canh Đầu Cá Lóc Đồng',
        description: 'Đầu cá lóc đồng tươi béo ngậy hầm mềm trong nước dùng ngọt thanh.',
        price: 55000,
        image_url: 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=800&q=80',
        taste_names: ['Béo', 'Cay', 'Mặn']
      },
      {
        name: 'Bánh Canh Bột Lọc Chả Cua',
        description: 'Viên chả cua đồng tươi hồng hào ngọt lịm nấu cùng bánh canh bột lọc dai trong.',
        price: 45000,
        image_url: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800&q=80',
        taste_names: ['Ngọt', 'Thanh đạm']
      },
      {
        name: 'Nem Chua & Chả Bò Cây Nhỏ',
        description: 'Nem chua và chả bò Đà Nẵng ăn kèm bánh canh tăng thêm vị chua cay hấp dẫn.',
        price: 25000,
        image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
        taste_names: ['Chua', 'Cay', 'Mặn']
      }
    ]
  },
  {
    name: 'Chè Sầu Liên Đà Nẵng',
    description: 'Thương hiệu chè sầu riêng và tàu hũ đá nổi tiếng bậc nhất Đà Nẵng, vị ngọt béo thanh mát từ cơm sầu riêng chín cây và nước cốt dừa tươi.',
    address: '189 Hoàng Diệu, Nam Dương',
    district_name: 'Hải Châu',
    cuisine_name: 'Ăn vặt & Chè',
    latitude: 16.0628,
    longitude: 108.2182,
    phone: '02363582582',
    website: 'https://chesaulien.vn',
    booking_url: 'https://dananggo.vn/dat-ban/che-sau-lien',
    promo_label: 'Thiên đường ăn vặt',
    avg_rating: 4.8,
    review_count: 3150,
    view_count: 6800,
    cover_image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=1200&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=1200&q=80'
    ],
    open_time: '08:00:00',
    close_time: '22:30:00',
    menu: [
      {
        name: 'Chè Thái Sầu Riêng Đặc Biệt',
        description: 'Chè Thái mít tươi, thạch lá dứa, hạt đác rim kết hợp múi sầu riêng béo ngậy thơm lừng.',
        price: 35000,
        image_url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=80',
        taste_names: ['Ngọt', 'Béo']
      },
      {
        name: 'Tàu Hũ Đá Sầu Riêng Cốt Dừa',
        description: 'Tàu hũ non mềm mịn như lụa rưới nước cốt dừa sánh béo và sốt sầu riêng nguyên chất.',
        price: 30000,
        image_url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&q=80',
        taste_names: ['Ngọt', 'Béo', 'Thanh đạm']
      },
      {
        name: 'Chè Khúc Bạch Hạnh Nhân Nhãn Lồng',
        description: 'Khúc bạch phô mai béo mịn ăn kèm nhãn lồng tươi giòn và hạnh nhân lát rang vàng.',
        price: 35000,
        image_url: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&q=80',
        taste_names: ['Ngọt', 'Thanh đạm', 'Béo']
      },
      {
        name: 'Dừa Dầm Sữa Tươi Trân Châu',
        description: 'Cơm dừa non bào sợi dầm sữa dừa mát lạnh kèm thạch dừa giòn sần sật.',
        price: 30000,
        image_url: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=800&q=80',
        taste_names: ['Ngọt', 'Béo']
      },
      {
        name: 'Flan Phô Mai Caramel Nhà Làm',
        description: 'Đĩa 2 bánh flan trứng sữa mềm mịn thơm lừng sốt cà phê caramel đắng nhẹ.',
        price: 25000,
        image_url: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800&q=80',
        taste_names: ['Ngọt', 'Béo']
      }
    ]
  },
  {
    name: 'Bánh Tráng Kẹp Dì Hoa & Ăn Vặt Chợ Cồn',
    description: 'Tọa độ ăn vặt trứ danh của giới trẻ Đà Nẵng với bánh tráng kẹp nướng than hồng, ốc hút cay xè và mít trộn da heo.',
    address: '62/2A Núi Thành, Hòa Thuận Đông',
    district_name: 'Hải Châu',
    cuisine_name: 'Ăn vặt & Chè',
    latitude: 16.0518,
    longitude: 108.2219,
    phone: '0905678910',
    website: 'https://banhtrangkepdihoa.dananggo.vn',
    booking_url: 'https://dananggo.vn/dat-ban/banh-trang-kep-di-hoa',
    promo_label: 'Ăn vặt số 1 Đà Thành',
    avg_rating: 4.7,
    review_count: 1450,
    view_count: 3400,
    cover_image: 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=1200&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80'
    ],
    open_time: '14:30:00',
    close_time: '22:00:00',
    menu: [
      {
        name: 'Bánh Tráng Kẹp Pate Trứng Ốp La',
        description: 'Bánh tráng kẹp pate gan béo bùi và trứng gà nướng giòn chấm sốt bò khô cay ngọt.',
        price: 25000,
        image_url: 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=800&q=80',
        taste_names: ['Béo', 'Cay', 'Ngọt']
      },
      {
        name: 'Ốc Hút Xào Sả Ớt Dừa Tươi',
        description: 'Đĩa ốc gạo và ốc đắng xào sả ớt nước dừa tươi vừa cay vừa ngọt béo.',
        price: 45000,
        image_url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&q=80',
        taste_names: ['Cay', 'Mặn', 'Ngọt']
      },
      {
        name: 'Mít Trộn Da Heo Đậu Phộng',
        description: 'Mít non luộc xé trộn da heo giòn, rau răm, hành phi và nước mắm chua ngọt.',
        price: 30000,
        image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
        taste_names: ['Chua', 'Cay', 'Béo']
      },
      {
        name: 'Yaourt Muối & Nước Mơ Đá',
        description: 'Combo hũ sữa chua dẻo chấm muối tinh khiết kèm ly nước mơ ngâm mát lạnh.',
        price: 20000,
        image_url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=80',
        taste_names: ['Chua', 'Ngọt', 'Mặn']
      }
    ]
  },
  {
    name: 'Cà Phê Sân Thượng Việt Ơi',
    description: 'Quán cà phê sân thượng ngắm trọn tầm mắt cầu Rồng và sông Hàn thơ mộng, nổi tiếng với cà phê muối Huế và cà phê dừa Đà Nẵng.',
    address: '102 Bạch Đằng, Hải Châu 1',
    district_name: 'Hải Châu',
    cuisine_name: 'Cà phê',
    latitude: 16.0682,
    longitude: 108.2249,
    phone: '0905112233',
    website: 'https://caphevietoi.dananggo.vn',
    booking_url: 'https://dananggo.vn/dat-ban/ca-phe-viet-oi',
    promo_label: 'View sông Hàn cực đỉnh',
    avg_rating: 4.8,
    review_count: 1380,
    view_count: 4100,
    cover_image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1200&q=80',
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&q=80'
    ],
    open_time: '06:30:00',
    close_time: '23:00:00',
    menu: [
      {
        name: 'Cà Phê Muối Kem Béo Đặc Biệt',
        description: 'Cà phê phin đậm đà phủ lớp kem muối mặn ngọt sánh mịn thơm nức.',
        price: 39000,
        image_url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80',
        taste_names: ['Béo', 'Ngọt', 'Mặn']
      },
      {
        name: 'Cà Phê Cốt Dừa Đá Xay',
        description: 'Sữa dừa non xay tuyết mịn màng hòa quyện espresso nguyên chất và dừa khô giòn.',
        price: 49000,
        image_url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80',
        taste_names: ['Ngọt', 'Béo']
      },
      {
        name: 'Trà Đào Cam Sả Nhiệt Đới',
        description: 'Trà đen ủ lạnh pha cam vàng, sả tươi và những miếng đào ngâm giòn ngọt.',
        price: 45000,
        image_url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&q=80',
        taste_names: ['Chua', 'Ngọt', 'Thanh đạm']
      },
      {
        name: 'Bánh Sừng Bò Croissant Bơ Pháp Trứng Muối',
        description: 'Bánh croissant ngàn lớp nướng mới mỗi sáng nhân sốt kim sa trứng muối tan chảy.',
        price: 45000,
        image_url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&q=80',
        taste_names: ['Béo', 'Mặn', 'Ngọt']
      }
    ]
  },
  {
    name: 'Sơn Trà Marina Café & Lounge',
    description: 'Tổ hợp cà phê và ẩm thực mang kiến trúc Santorini trắng xanh bên vịnh biển Sơn Trà, điểm check-in hoàng hôn đẹp nhất Đà Nẵng.',
    address: 'Hồ Xanh, Đường Hoàng Sa, Thọ Quang',
    district_name: 'Sơn Trà',
    cuisine_name: 'Cà phê',
    latitude: 16.1032,
    longitude: 108.2541,
    phone: '0905998877',
    website: 'https://sontramarina.vn',
    booking_url: 'https://dananggo.vn/dat-ban/son-tra-marina',
    promo_label: 'Santorini bên vịnh biển',
    avg_rating: 4.7,
    review_count: 2150,
    view_count: 5900,
    cover_image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1200&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&q=80'
    ],
    open_time: '07:00:00',
    close_time: '22:00:00',
    menu: [
      {
        name: 'Cold Brew Cam Quế Mật Ong Rừng',
        description: 'Cà phê ủ lạnh 18 giờ kết hợp nước cam tươi và mật ong rừng Sơn Trà thanh mát.',
        price: 65000,
        image_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80',
        taste_names: ['Chua', 'Ngọt', 'Thanh đạm']
      },
      {
        name: 'Sinh Tố Xoài Dừa Nhiệt Đới',
        description: 'Xoài cát chín mọng xay cùng kem cốt dừa non mát lạnh ngày nắng biển.',
        price: 69000,
        image_url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&q=80',
        taste_names: ['Ngọt', 'Béo', 'Chua']
      },
      {
        name: 'Trà Hoa Đậu Biếc Macchiato',
        description: 'Trà hoa đậu biếc xanh biếc như màu biển Sơn Trà phủ lớp kem phô mai mặn béo.',
        price: 59000,
        image_url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80',
        taste_names: ['Béo', 'Mặn', 'Thanh đạm']
      },
      {
        name: 'Bánh Tiramisu Cà Phê Ý',
        description: 'Bánh tiramisu mềm ẩm lớp phô mai mascarpone béo mịn rắc bột cacao nguyên chất.',
        price: 75000,
        image_url: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800&q=80',
        taste_names: ['Ngọt', 'Béo']
      }
    ]
  },
  {
    name: 'Đặc Sản Trần - Bánh Tráng Cuốn Thịt Heo',
    description: 'Hệ thống nhà hàng đặc sản nổi tiếng Đà Nẵng với món bánh tráng phơi sương cuốn thịt heo hai đầu da, rau rừng và mắm nêm cá cơm nguyên chất.',
    address: '04 Lê Duẩn, Hải Châu 1',
    district_name: 'Hải Châu',
    cuisine_name: 'Cơm nhà',
    latitude: 16.0721,
    longitude: 108.2215,
    phone: '02363849555',
    website: 'https://dacsantran.vn',
    booking_url: 'https://dananggo.vn/dat-ban/dac-san-tran',
    promo_label: 'Đặc sản trứ danh',
    avg_rating: 4.8,
    review_count: 2340,
    view_count: 5100,
    cover_image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80'
    ],
    open_time: '09:00:00',
    close_time: '22:00:00',
    menu: [
      {
        name: 'Bánh Tráng Cuốn Thịt Heo Hai Đầu Da',
        description: 'Thịt heo hấp giữ trọn độ ngọt và hai đầu da giòn sần sật, cuốn bánh tráng Đại Lộc và mắm nêm.',
        price: 115000,
        image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
        taste_names: ['Mặn', 'Cay', 'Thanh đạm']
      },
      {
        name: 'Bún Mắm Nêm Thịt Heo Quay Giòn Bì',
        description: 'Tô bún mắm nêm thơm nồng ăn kèm thịt heo quay da nổ giòn rụm và mít non.',
        price: 65000,
        image_url: 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=800&q=80',
        taste_names: ['Mặn', 'Cay', 'Béo']
      },
      {
        name: 'Bánh Bèo Nậm Lọc Xứ Quảng',
        description: 'Mâm bánh bèo, bánh nậm, bánh bột lọc nhân tôm thịt gói lá chuối truyền thống.',
        price: 75000,
        image_url: 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=800&q=80',
        taste_names: ['Mặn', 'Ngọt', 'Thanh đạm']
      },
      {
        name: 'Chả Bò Đà Nẵng Đặc Biệt (Đĩa 300g)',
        description: 'Chả bò đùi 100% hồng hào giòn dai thơm nồng mùi tiêu đen và lá chuối.',
        price: 110000,
        image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
        taste_names: ['Mặn', 'Cay']
      }
    ]
  },
  {
    name: 'Bê Thui Cầu Mống Mười',
    description: 'Đặc sản bê thui Cầu Mống trứ danh vùng ven sông Cẩm Lệ, thịt bê tơ thui rơm vàng ươm da giòn thịt tái hồng mềm ngọt chấm mắm cái cá cơm.',
    address: '138 Nguyễn Hữu Thọ, Hòa Thuận Tây',
    district_name: 'Cẩm Lệ',
    cuisine_name: 'Cơm nhà',
    latitude: 16.0315,
    longitude: 108.2104,
    phone: '02363699777',
    website: 'https://bethuimuoi.dananggo.vn',
    booking_url: 'https://dananggo.vn/dat-ban/be-thui-cau-mong-muoi',
    promo_label: 'Đặc sản Cẩm Lệ',
    avg_rating: 4.7,
    review_count: 980,
    view_count: 2450,
    cover_image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80'
    ],
    open_time: '09:30:00',
    close_time: '22:00:00',
    menu: [
      {
        name: 'Bê Thui Cầu Mống Cuốn Rau Rừng',
        description: 'Thịt bê tơ thui rơm thái lát mỏng cuốn bánh tráng, khế chua, chuối chát và mắm cái.',
        price: 135000,
        image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80',
        taste_names: ['Mặn', 'Cay', 'Chua']
      },
      {
        name: 'Lòng Bê & Xáo Bê Hầm Đậu Phộng',
        description: 'Tô xáo bê hầm xương và đậu phộng béo bùi ăn kèm bánh tráng nướng.',
        price: 95000,
        image_url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80',
        taste_names: ['Béo', 'Ngọt', 'Mặn']
      },
      {
        name: 'Bê Xào Sả Ớt Lá Chanh',
        description: 'Thịt bê tươi xào lửa lớn cùng sả ớt và lá chanh thơm dậy mùi.',
        price: 125000,
        image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
        taste_names: ['Cay', 'Mặn']
      }
    ]
  },
  {
    name: 'Gà Nướng Cơm Lam Hòa Bắc',
    description: 'Ẩm thực sinh thái núi rừng Hòa Vang với gà đồi thả vườn nướng mắc khén, cơm lam ống tre nếp nương thơm dẻo bên dòng sông Cu Đê.',
    address: 'Thôn Tà Lang, Xã Hòa Bắc',
    district_name: 'Hòa Vang',
    cuisine_name: 'Cơm nhà',
    latitude: 16.1225,
    longitude: 108.0412,
    phone: '0905444888',
    website: 'https://ganuonghoabac.dananggo.vn',
    booking_url: 'https://dananggo.vn/dat-ban/ga-nuong-com-lam-hoa-bac',
    promo_label: 'Ẩm thực núi rừng',
    avg_rating: 4.8,
    review_count: 620,
    view_count: 1780,
    cover_image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=1200&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&q=80'
    ],
    open_time: '09:00:00',
    close_time: '20:30:00',
    menu: [
      {
        name: 'Gà Đồi Nướng Than Hoa Cơm Lam (Nửa con)',
        description: 'Gà đồi thả vườn da giòn vàng óng ăn kèm 2 ống cơm lam nướng thơm mùi tre non và muối đậu.',
        price: 160000,
        image_url: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=800&q=80',
        taste_names: ['Mặn', 'Ngọt', 'Béo']
      },
      {
        name: 'Cá Suối Chiên Giòn Cuốn Lá Lốt',
        description: 'Cá niên suối Hòa Bắc chiên giòn nguyên con chấm mắm me chua ngọt.',
        price: 95000,
        image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80',
        taste_names: ['Chua', 'Ngọt', 'Béo']
      },
      {
        name: 'Rau Rừng Luộc Chấm Kho Quẹt Tóp Mỡ',
        description: 'Đĩa rau dớn rừng Hòa Bắc luộc xanh mướt chấm kho quẹt tôm khô tóp mỡ đậm đà.',
        price: 55000,
        image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80',
        taste_names: ['Thanh đạm', 'Mặn', 'Cay']
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
      'https://images.unsplash.com/photo-1528127269322-539801943592?w=1200&q=80'
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
    cover_image: 'https://images.unsplash.com/photo-1546587348-d12660c30c50?w=1200&q=80',
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
  },
  // --- BỔ SUNG CÁC ĐIỂM DU LỊCH (ĐẶC BIỆT LÀ NÚI / THIÊN NHIÊN, GIẢI TRÍ, BIỂN) ---
  {
    name: 'Đỉnh Bàn Cờ - Bán Đảo Sơn Trà',
    description: 'Đỉnh núi cao gần 700m trên bán đảo Sơn Trà, nơi đặt bức tượng Đế Thích đánh cờ giữa mây trời và góc nhìn toàn cảnh vịnh biển Đà Nẵng hùng vĩ.',
    address: 'Đường lên Đỉnh Bàn Cờ, Thọ Quang',
    district_name: 'Sơn Trà',
    category_name: 'Núi / Thiên nhiên',
    latitude: 16.1185,
    longitude: 108.2589,
    phone: '02363935588',
    website: 'https://sontra.danang.gov.vn/dinh-ban-co',
    booking_url: 'https://dananggo.vn/diem-den/dinh-ban-co',
    promo_label: 'Nóc nhà Đà Nẵng',
    ticket_price: 0,
    visit_duration_minutes: 120,
    avg_rating: 4.9,
    review_count: 1650,
    view_count: 4300,
    cover_image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1546587348-d12660c30c50?w=1200&q=80'
    ],
    open_time: '06:00:00',
    close_time: '18:00:00'
  },
  {
    name: 'Đèo Hải Vân & Hải Vân Quan',
    description: 'Cung đường đèo ven biển ngoạn mục bậc nhất Việt Nam mệnh danh Thiên hạ đệ nhất hùng quan, nơi giao thoa giữa núi rừng Trường Sơn và vịnh Lăng Cô - Đà Nẵng.',
    address: 'Đỉnh Đèo Hải Vân, Hòa Hiệp Bắc',
    district_name: 'Liên Chiểu',
    category_name: 'Núi / Thiên nhiên',
    latitude: 16.1882,
    longitude: 108.1304,
    phone: '02363842222',
    website: 'https://danangfantasticity.com/deo-hai-van',
    booking_url: 'https://dananggo.vn/diem-den/deo-hai-van',
    promo_label: 'Đệ nhất hùng quan',
    ticket_price: 0,
    visit_duration_minutes: 150,
    avg_rating: 4.9,
    review_count: 2740,
    view_count: 6900,
    cover_image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80'
    ],
    open_time: '05:30:00',
    close_time: '18:30:00'
  },
  {
    name: 'Khu Sinh Thái Suối Hoa Hòa Vang',
    description: 'Thung lũng sinh thái rừng nguyên sinh mát lành với thác nước tự nhiên, thảm hoa rừng rực rỡ và các hoạt động dã ngoại bên suối.',
    address: 'Thôn Phú Túc, Xã Hòa Phú',
    district_name: 'Hòa Vang',
    category_name: 'Núi / Thiên nhiên',
    latitude: 15.9752,
    longitude: 108.0512,
    phone: '02363681666',
    website: 'https://suoihoa.dananggo.vn',
    booking_url: 'https://dananggo.vn/ve/khu-sinh-thai-suoi-hoa',
    promo_label: 'Dã ngoại thiên nhiên',
    ticket_price: 100000,
    visit_duration_minutes: 210,
    avg_rating: 4.6,
    review_count: 780,
    view_count: 2100,
    cover_image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80'
    ],
    open_time: '07:30:00',
    close_time: '17:30:00'
  },
  {
    name: 'Công Viên Suối Khoáng Nóng Núi Thần Tài',
    description: 'Khu nghỉ dưỡng tắm khoáng nóng, tắm bùn, onsen Nhật Bản và công viên nước giữa rừng nguyên sinh Bà Nà - Núi Chúa.',
    address: 'QL14G, Thôn Phú Túc, Hòa Phú',
    district_name: 'Hòa Vang',
    category_name: 'Giải trí',
    latitude: 15.9665,
    longitude: 108.0342,
    phone: '0898181777',
    website: 'https://nuithantai.vn',
    booking_url: 'https://dananggo.vn/ve/nui-than-tai',
    promo_label: 'Khoáng nóng thiên nhiên',
    ticket_price: 450000,
    visit_duration_minutes: 300,
    avg_rating: 4.8,
    review_count: 2180,
    view_count: 5600,
    cover_image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=80'
    ],
    open_time: '08:00:00',
    close_time: '17:30:00'
  },
  {
    name: 'Công Viên Châu Á - Asia Park (Da Nang Downtown)',
    description: 'Tổ hợp giải trí sôi động trung tâm Đà Nẵng với vòng quay mặt trời Sun Wheel cao 115m, chợ đêm VUI-Fest và hàng chục trò chơi cảm giác mạnh.',
    address: 'Số 01 Phan Đăng Lưu, Hòa Cường Bắc',
    district_name: 'Hải Châu',
    category_name: 'Giải trí',
    latitude: 16.0398,
    longitude: 108.2281,
    phone: '02363681666',
    website: 'https://asiapark.sunworld.vn',
    booking_url: 'https://dananggo.vn/ve/asia-park',
    promo_label: 'Vòng quay Sun Wheel',
    ticket_price: 200000,
    visit_duration_minutes: 180,
    avg_rating: 4.7,
    review_count: 1940,
    view_count: 4850,
    cover_image: 'https://images.unsplash.com/photo-1513883049090-d0b7439799bf?w=1200&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1200&q=80'
    ],
    open_time: '15:00:00',
    close_time: '22:00:00'
  },
  {
    name: 'Ghềnh Đá & Rạn Nam Ô',
    description: 'Bãi đá rêu xanh hoang sơ bên làng nghề nước mắm Nam Ô hơn trăm năm tuổi, điểm đón bình minh tuyệt đẹp phía Bắc vịnh Đà Nẵng.',
    address: 'Làng Nam Ô, Hòa Hiệp Nam',
    district_name: 'Liên Chiểu',
    category_name: 'Bãi biển',
    latitude: 16.1194,
    longitude: 108.1338,
    phone: '02363777111',
    website: 'https://danangfantasticity.com/ran-nam-o',
    booking_url: 'https://dananggo.vn/diem-den/ran-nam-o',
    promo_label: 'Vẻ đẹp hoang sơ',
    ticket_price: 0,
    visit_duration_minutes: 120,
    avg_rating: 4.7,
    review_count: 890,
    view_count: 2300,
    cover_image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1200&q=80'
    ],
    open_time: '05:00:00',
    close_time: '18:30:00'
  },
  {
    name: 'Công Viên APEC Đà Nẵng',
    description: 'Công trình kiến trúc mái vòm cánh diều khổng lồ bên bờ sông Hàn, không gian triển lãm văn hóa và điểm check-in hiện đại bậc nhất trung tâm thành phố.',
    address: 'Đường 2 Tháng 9, Bình Hiên',
    district_name: 'Hải Châu',
    category_name: 'Văn hóa / Lịch sử',
    latitude: 16.0589,
    longitude: 108.2241,
    phone: '02363822111',
    website: 'https://danangfantasticity.com/cong-vien-apec',
    booking_url: 'https://dananggo.vn/diem-den/cong-vien-apec',
    promo_label: 'Check-in kiến trúc',
    ticket_price: 0,
    visit_duration_minutes: 60,
    avg_rating: 4.8,
    review_count: 1520,
    view_count: 3900,
    cover_image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1200&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1200&q=80'
    ],
    open_time: '00:00:00',
    close_time: '23:59:00'
  },
  {
    name: 'Chùa Pháp Lâm Trung Tâm Đà Nẵng',
    description: 'Ngôi cổ tự thanh tịnh tọa lạc ngay giữa phố Ông Ích Khiêm sầm uất với kiến trúc Á Đông trang nghiêm và tượng Phật Thích Ca uy nghi.',
    address: '574 Ông Ích Khiêm, Nam Dương',
    district_name: 'Hải Châu',
    category_name: 'Chùa / Tâm linh',
    latitude: 16.0652,
    longitude: 108.2158,
    phone: '02363825444',
    website: 'https://chuaphaplam.dananggo.vn',
    booking_url: 'https://dananggo.vn/diem-den/chua-phap-lam',
    promo_label: 'Chốn tâm linh thanh tịnh',
    ticket_price: 0,
    visit_duration_minutes: 60,
    avg_rating: 4.7,
    review_count: 680,
    view_count: 1750,
    cover_image: 'https://images.unsplash.com/photo-1546587348-d12660c30c50?w=1200&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1528127269322-539801943592?w=1200&q=80'
    ],
    open_time: '05:30:00',
    close_time: '21:00:00'
  }
];

const SEED_ACCOMMODATIONS: SeedAccommodation[] = [
  // --- 1. BỔ SUNG HỆ THỐNG HOMESTAY PHONG PHÚ ĐỦ QUẬN & NGÂN SÁCH (200K -> 1.2M) ---
  {
    name: 'An Thượng Beach Homestay',
    description: 'Homestay phong cách nhiệt đới cách bãi biển Mỹ Khê chỉ 3 phút đi bộ, có sân vườn xanh mát, bếp chung tiện nghi và sân thượng ngắm gió biển.',
    address: '26 An Thượng 4, Mỹ An',
    district_name: 'Ngũ Hành Sơn',
    accommodation_type: 'HOMESTAY',
    star_rating: 3,
    latitude: 16.0512,
    longitude: 108.2462,
    phone: '0905212121',
    website: 'https://anthuonghomestay.dananggo.vn',
    booking_url: 'https://dananggo.vn/luu-tru/an-thuong-beach-homestay',
    promo_label: 'Sát biển Mỹ Khê',
    avg_rating: 4.8,
    review_count: 340,
    view_count: 1850,
    cover_image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80'
    ],
    amenity_names: ['Wi-Fi miễn phí', 'Điều hòa', 'Gần biển', 'Chỗ đậu xe'],
    rooms: [
      {
        name: 'Phòng Đơn Cozy Garden',
        description: 'Phòng ấm cúng có cửa sổ nhìn ra vườn cây nhiệt đới, đầy đủ điều hòa và bàn làm việc.',
        price_per_night: 280000,
        original_price: 350000,
        capacity: 2,
        bed_type: '1 Giường Đôi Queen',
        total_rooms: 5
      },
      {
        name: 'Phòng Đôi Ban Công Gió Biển',
        description: 'Phòng rộng rãi có ban công riêng đón nắng sớm gần khu phố Tây An Thượng.',
        price_per_night: 420000,
        original_price: 520000,
        capacity: 2,
        bed_type: '1 Giường King',
        total_rooms: 4
      },
      {
        name: 'Phòng Gia Đình Studio Có Bếp',
        description: 'Căn hộ studio nhỏ trong homestay có khu bếp riêng, phù hợp nhóm bạn 4 người.',
        price_per_night: 650000,
        original_price: 800000,
        capacity: 4,
        bed_type: '2 Giường Đôi',
        total_rooms: 3
      }
    ]
  },
  {
    name: 'Han River View Boutique Homestay',
    description: 'Homestay thiết kế Indochine tinh tế ngay trung tâm Hải Châu, ban công hướng sông Hàn và cầu Rồng, thuận tiện dạo phố đêm.',
    address: '45 Trần Phú, Hải Châu 1',
    district_name: 'Hải Châu',
    accommodation_type: 'HOMESTAY',
    star_rating: 4,
    latitude: 16.0695,
    longitude: 108.2238,
    phone: '0905323232',
    website: 'https://hanriverhomestay.dananggo.vn',
    booking_url: 'https://dananggo.vn/luu-tru/han-river-view-homestay',
    promo_label: 'View sông Hàn',
    avg_rating: 4.9,
    review_count: 410,
    view_count: 2200,
    cover_image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80'
    ],
    amenity_names: ['Wi-Fi miễn phí', 'Điều hòa', 'Bữa sáng', 'Đưa đón sân bay'],
    rooms: [
      {
        name: 'Phòng Indochine Standard',
        description: 'Không gian hoài cổ lát gạch bông truyền thống, yên tĩnh ngay trung tâm thành phố.',
        price_per_night: 380000,
        original_price: 460000,
        capacity: 2,
        bed_type: '1 Giường Queen',
        total_rooms: 4
      },
      {
        name: 'Phòng Deluxe Ban Công Sông Hàn',
        description: 'Ban công riêng nhìn thẳng ra bờ sông Hàn lộng gió, kèm trà chiều miễn phí.',
        price_per_night: 550000,
        original_price: 680000,
        capacity: 2,
        bed_type: '1 Giường King',
        total_rooms: 4
      },
      {
        name: 'Suite Gia Đình Indochine Loft',
        description: 'Phòng thông tầng rộng 45m2 dành cho gia đình hoặc nhóm bạn thích không gian nghệ thuật.',
        price_per_night: 850000,
        original_price: 1050000,
        capacity: 4,
        bed_type: '2 Giường Queen',
        total_rooms: 2
      }
    ]
  },
  {
    name: 'Sơn Trà Sea Breeze Homestay',
    description: 'Homestay xinh xắn rợp bóng dừa xanh gần bãi tắm Phạm Văn Đồng và bán đảo Sơn Trà, không gian yên bình như ngôi nhà thứ hai.',
    address: '112 Hà Bổng, Phước Mỹ',
    district_name: 'Sơn Trà',
    accommodation_type: 'HOMESTAY',
    star_rating: 3,
    latitude: 16.0668,
    longitude: 108.2449,
    phone: '0905434343',
    website: 'https://sontraseabreeze.dananggo.vn',
    booking_url: 'https://dananggo.vn/luu-tru/son-tra-sea-breeze-homestay',
    promo_label: 'Cách biển 150m',
    avg_rating: 4.7,
    review_count: 295,
    view_count: 1640,
    cover_image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=80'
    ],
    amenity_names: ['Wi-Fi miễn phí', 'Điều hòa', 'Gần biển', 'Bữa sáng'],
    rooms: [
      {
        name: 'Phòng Sea Breeze Đôi Tiết Kiệm',
        description: 'Phòng sáng thoáng cách bãi biển Phước Mỹ vài bước chân, giá cực kỳ hợp lý.',
        price_per_night: 320000,
        original_price: 400000,
        capacity: 2,
        bed_type: '1 Giường Đôi',
        total_rooms: 6
      },
      {
        name: 'Phòng Superior Cửa Sổ Lớn',
        description: 'Phòng trang trí gỗ mộc ấm áp, có bàn trà nhỏ và tủ lạnh mini.',
        price_per_night: 480000,
        original_price: 590000,
        capacity: 2,
        bed_type: '1 Giường King',
        total_rooms: 4
      },
      {
        name: 'Phòng Nhóm Bạn 4 Người',
        description: 'Phòng rộng cho nhóm bạn du lịch tự túc, gần chợ hải sản Sơn Trà.',
        price_per_night: 720000,
        original_price: 880000,
        capacity: 4,
        bed_type: '2 Giường Đôi',
        total_rooms: 3
      }
    ]
  },
  {
    name: 'Hòa Bắc Eco Valley Homestay',
    description: 'Homestay sinh thái nghỉ dưỡng giữa thung lũng Hòa Bắc xanh mướt bên dòng sông Cu Đê, có hồ bơi suối tự nhiên và khu nướng BBQ ngoài trời.',
    address: 'Thôn Nam Yên, Xã Hòa Bắc',
    district_name: 'Hòa Vang',
    accommodation_type: 'HOMESTAY',
    star_rating: 3,
    latitude: 16.1204,
    longitude: 108.0518,
    phone: '0905545454',
    website: 'https://hoabaceco.dananggo.vn',
    booking_url: 'https://dananggo.vn/luu-tru/hoa-bac-eco-valley-homestay',
    promo_label: 'Homestay sinh thái đồi núi',
    avg_rating: 4.8,
    review_count: 230,
    view_count: 1480,
    cover_image: 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=1200&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=1200&q=80'
    ],
    amenity_names: ['Wi-Fi miễn phí', 'Điều hòa', 'Bữa sáng', 'Chỗ đậu xe'],
    rooms: [
      {
        name: 'Bungalow Tre Hướng Suối',
        description: 'Bungalow gỗ tre mộc mạc mát mẻ nhìn ra cánh đồng mía và dòng suối trong lành.',
        price_per_night: 250000,
        original_price: 320000,
        capacity: 2,
        bed_type: '1 Giường Đôi',
        total_rooms: 5
      },
      {
        name: 'Bungalow Đồi Thông Riêng Tư',
        description: 'Nhà gỗ biệt lập có hiên uống trà ngắm sương sớm thung lũng Hòa Bắc.',
        price_per_night: 390000,
        original_price: 490000,
        capacity: 2,
        bed_type: '1 Giường King',
        total_rooms: 4
      },
      {
        name: 'Nhà Sàn Gia Đình Eco',
        description: 'Nhà sàn gỗ rộng rãi có sân BBQ riêng cho gia đình hoặc nhóm 6 khách.',
        price_per_night: 650000,
        original_price: 820000,
        capacity: 6,
        bed_type: '3 Giường Đôi',
        total_rooms: 2
      }
    ]
  },
  {
    name: 'The Lena Pool Villa & Homestay',
    description: 'Homestay cao cấp tích hợp hồ bơi nước mặn giữa sân vườn nhiệt đới tại trung tâm Hải Châu, thiết kế Địa Trung Hải sang trọng.',
    address: '68 Nguyễn Chí Thanh, Hải Châu 1',
    district_name: 'Hải Châu',
    accommodation_type: 'HOMESTAY',
    star_rating: 5,
    latitude: 16.0719,
    longitude: 108.2214,
    phone: '0905656565',
    website: 'https://lenahomestay.dananggo.vn',
    booking_url: 'https://dananggo.vn/luu-tru/the-lena-pool-homestay',
    promo_label: 'Homestay có hồ bơi',
    avg_rating: 4.9,
    review_count: 375,
    view_count: 2150,
    cover_image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80'
    ],
    amenity_names: ['Wi-Fi miễn phí', 'Hồ bơi', 'Bữa sáng', 'Điều hòa', 'Đưa đón sân bay', 'Chỗ đậu xe'],
    rooms: [
      {
        name: 'Phòng Deluxe Pool Access',
        description: 'Phòng tầng trệt mở cửa bước thẳng ra hồ bơi xanh mát và khu vườn cọ.',
        price_per_night: 480000,
        original_price: 600000,
        capacity: 2,
        bed_type: '1 Giường King',
        total_rooms: 4
      },
      {
        name: 'Suite Ban Công Bồn Tắm Nằm',
        description: 'Phòng sang trọng có bồn tắm sứ thư giãn và ban công ngập tràn ánh sáng.',
        price_per_night: 680000,
        original_price: 850000,
        capacity: 2,
        bed_type: '1 Giường King Lớn',
        total_rooms: 3
      },
      {
        name: 'Penthouse Homestay 2 Phòng Ngủ',
        description: 'Căn tầng thượng rộng 75m2 có phòng khách, bếp đảo và sân hiên ngắm pháo hoa.',
        price_per_night: 1150000,
        original_price: 1400000,
        capacity: 4,
        bed_type: '2 Giường King',
        total_rooms: 2
      }
    ]
  },
  {
    name: 'Nam Ô Coastal Village Homestay',
    description: 'Homestay bình yên sát vịnh biển Nguyễn Tất Thành và rạn Nam Ô, giá sinh viên cực kỳ tiết kiệm dành cho tín đồ phượt đèo Hải Vân.',
    address: '89 Nguyễn Tất Thành, Xuân Hà',
    district_name: 'Liên Chiểu',
    accommodation_type: 'HOMESTAY',
    star_rating: 2,
    latitude: 16.0912,
    longitude: 108.1645,
    phone: '0905767676',
    website: 'https://namohomestay.dananggo.vn',
    booking_url: 'https://dananggo.vn/luu-tru/nam-o-coastal-homestay',
    promo_label: 'Giá tiết kiệm sát biển',
    avg_rating: 4.6,
    review_count: 190,
    view_count: 1120,
    cover_image: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=1200&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=80'
    ],
    amenity_names: ['Wi-Fi miễn phí', 'Điều hòa', 'Gần biển', 'Chỗ đậu xe'],
    rooms: [
      {
        name: 'Phòng Đơn Phượt Thủ Tiết Kiệm',
        description: 'Phòng gọn gàng sạch sẽ đầy đủ điều hòa, nước nóng và chỗ để xe máy an toàn.',
        price_per_night: 200000,
        original_price: 260000,
        capacity: 2,
        bed_type: '1 Giường Đôi',
        total_rooms: 6
      },
      {
        name: 'Phòng Đôi Hướng Vịnh Đà Nẵng',
        description: 'Cửa sổ nhìn thẳng ra biển Nguyễn Tất Thành và dãy núi Hải Vân phía xa.',
        price_per_night: 320000,
        original_price: 400000,
        capacity: 2,
        bed_type: '1 Giường Queen',
        total_rooms: 4
      },
      {
        name: 'Phòng Nhóm 4 Khách Ven Biển',
        description: 'Phòng 2 giường đôi rộng rãi, miễn phí mượn xe đạp dạo biển buổi sáng.',
        price_per_night: 490000,
        original_price: 600000,
        capacity: 4,
        bed_type: '2 Giường Đôi',
        total_rooms: 3
      }
    ]
  },
  {
    name: 'Cẩm Lệ Riverside Garden Homestay',
    description: 'Homestay nhà vườn yên tĩnh bên bờ sông Cẩm Lệ, không gian xanh mát với giàn hoa giấy và hồ cá Koi thư thái.',
    address: '54 Thăng Long, Khuê Trung',
    district_name: 'Cẩm Lệ',
    accommodation_type: 'HOMESTAY',
    star_rating: 3,
    latitude: 16.0245,
    longitude: 108.2162,
    phone: '0905878787',
    website: 'https://camlehomestay.dananggo.vn',
    booking_url: 'https://dananggo.vn/luu-tru/cam-le-garden-homestay',
    promo_label: 'Nhà vườn ven sông',
    avg_rating: 4.7,
    review_count: 165,
    view_count: 980,
    cover_image: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=1200&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80'
    ],
    amenity_names: ['Wi-Fi miễn phí', 'Điều hòa', 'Bữa sáng', 'Chỗ đậu xe'],
    rooms: [
      {
        name: 'Phòng Garden View Tiêu Chuẩn',
        description: 'Phòng nhìn ra hồ cá Koi và vườn cây ăn trái mát rượi.',
        price_per_night: 260000,
        original_price: 330000,
        capacity: 2,
        bed_type: '1 Giường Queen',
        total_rooms: 4
      },
      {
        name: 'Phòng Deluxe Hiền Hòa Ven Sông',
        description: 'Có hiên ngồi uống trà chiều ngắm sông Cẩm Lệ êm đềm.',
        price_per_night: 390000,
        original_price: 480000,
        capacity: 2,
        bed_type: '1 Giường King',
        total_rooms: 3
      },
      {
        name: 'Phòng Gia Đình Sân Vườn',
        description: 'Phòng lớn tầng 1 thuận tiện cho gia đình có trẻ nhỏ hoặc người lớn tuổi.',
        price_per_night: 580000,
        original_price: 720000,
        capacity: 4,
        bed_type: '2 Giường Đôi',
        total_rooms: 2
      }
    ]
  },
  {
    name: 'Mỹ Khê Boho Chic Homestay',
    description: 'Homestay phong cách Bohemian trẻ trung rực rỡ sắc màu tại quận Sơn Trà, điểm lưu trú yêu thích của các cặp đôi và tín đồ sống ảo.',
    address: '39 Lâm Hoành, Phước Mỹ',
    district_name: 'Sơn Trà',
    accommodation_type: 'HOMESTAY',
    star_rating: 4,
    latitude: 16.0621,
    longitude: 108.2456,
    phone: '0905989898',
    website: 'https://mykheboho.dananggo.vn',
    booking_url: 'https://dananggo.vn/luu-tru/my-khe-boho-homestay',
    promo_label: 'Check-in Boho sát biển',
    avg_rating: 4.8,
    review_count: 310,
    view_count: 1790,
    cover_image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=80'
    ],
    amenity_names: ['Wi-Fi miễn phí', 'Điều hòa', 'Gần biển', 'Bữa sáng'],
    rooms: [
      {
        name: 'Phòng Boho Sunlit Studio',
        description: 'Phòng decor macrame thủ công, cửa kính đón nắng và võng thư giãn.',
        price_per_night: 340000,
        original_price: 420000,
        capacity: 2,
        bed_type: '1 Giường Queen',
        total_rooms: 5
      },
      {
        name: 'Phòng Boho Ocean Balcony',
        description: 'Phòng tầng cao có ban công hướng biển Mỹ Khê và máy chiếu phim mini.',
        price_per_night: 520000,
        original_price: 650000,
        capacity: 2,
        bed_type: '1 Giường King',
        total_rooms: 4
      }
    ]
  },
  {
    name: 'Non Nước Zen Garden Homestay',
    description: 'Homestay thiền định nằm dưới chân danh thắng Ngũ Hành Sơn và bãi biển Non Nước, không gian tĩnh lặng ngập tràn hương sả chanh.',
    address: '18 Huyền Trân Công Chúa, Hòa Hải',
    district_name: 'Ngũ Hành Sơn',
    accommodation_type: 'HOMESTAY',
    star_rating: 4,
    latitude: 16.0068,
    longitude: 108.2642,
    phone: '0905191919',
    website: 'https://nonnuoczen.dananggo.vn',
    booking_url: 'https://dananggo.vn/luu-tru/non-nuoc-zen-homestay',
    promo_label: 'Không gian Thiền & Biển',
    avg_rating: 4.9,
    review_count: 275,
    view_count: 1560,
    cover_image: 'https://images.unsplash.com/photo-1540518614846-7ede433c4ef1?w=1200&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80'
    ],
    amenity_names: ['Wi-Fi miễn phí', 'Hồ bơi', 'Bữa sáng', 'Điều hòa', 'Gần biển', 'Chỗ đậu xe'],
    rooms: [
      {
        name: 'Phòng Zen Lotus',
        description: 'Phòng nhìn ra hồ sen nhỏ dưới chân núi Thủy Sơn thanh tịnh.',
        price_per_night: 420000,
        original_price: 520000,
        capacity: 2,
        bed_type: '1 Giường King',
        total_rooms: 4
      },
      {
        name: 'Villa Homestay Sân Vườn Riêng',
        description: 'Căn villa nhỏ 2 phòng ngủ có hồ ngâm thư giãn và vườn trà đạo.',
        price_per_night: 890000,
        original_price: 1100000,
        capacity: 4,
        bed_type: '2 Giường King',
        total_rooms: 2
      }
    ]
  },
  // --- 2. BỔ SUNG KHÁCH SẠN / RESORT / HOSTEL / CĂN HỘ ĐỦ HẠNG SAO (1 -> 5 SAO) ---
  {
    name: 'Novotel Danang Premier Han River',
    description: 'Khách sạn 5 sao quốc tế biểu tượng bên bờ Tây sông Hàn với hồ bơi ngoài trời, hệ thống nhà hàng Âu - Á và Sky36 Bar cao nhất Đà Nẵng.',
    address: '36 Bạch Đằng, Thạch Thang',
    district_name: 'Hải Châu',
    accommodation_type: 'HOTEL',
    star_rating: 5,
    latitude: 16.0776,
    longitude: 108.2244,
    phone: '02363929999',
    website: 'https://novotel-danang-premier.com',
    booking_url: 'https://dananggo.vn/luu-tru/novotel-danang-premier',
    promo_label: 'Khách sạn 5★ Sông Hàn',
    avg_rating: 4.9,
    review_count: 1850,
    view_count: 6200,
    cover_image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&q=80'
    ],
    amenity_names: ['Wi-Fi miễn phí', 'Hồ bơi', 'Bữa sáng', 'Điều hòa', 'Đưa đón sân bay', 'Chỗ đậu xe'],
    rooms: [
      {
        name: 'Superior River View',
        description: 'Phòng tầng cao ôm trọn toàn cảnh sông Hàn và các cây cầu biểu tượng về đêm.',
        price_per_night: 1650000,
        original_price: 2100000,
        capacity: 2,
        bed_type: '1 Giường King',
        total_rooms: 15
      },
      {
        name: 'Executive Panoramic Suite',
        description: 'Đặc quyền Premier Lounge, bữa sáng buffet quốc tế và tầm nhìn 180 độ ra vịnh Đà Nẵng.',
        price_per_night: 2600000,
        original_price: 3200000,
        capacity: 2,
        bed_type: '1 Giường King Lớn',
        total_rooms: 8
      },
      {
        name: 'Căn Hộ Dịch Vụ 2 Phòng Ngủ Novotel',
        description: 'Căn hộ 5 sao đầy đủ phòng khách và bếp hiện đại cho kỳ nghỉ gia đình.',
        price_per_night: 3800000,
        original_price: 4500000,
        capacity: 4,
        bed_type: '2 Giường King',
        total_rooms: 5
      }
    ]
  },
  {
    name: 'A La Carte Da Nang Beach Apartment',
    description: 'Tổ hợp căn hộ khách sạn 4 sao đối diện bãi biển Mỹ Khê, nổi tiếng với hồ bơi vô cực trên tầng thượng đầu tiên tại Việt Nam.',
    address: '200 Võ Nguyên Giáp, Phước Mỹ',
    district_name: 'Sơn Trà',
    accommodation_type: 'APARTMENT',
    star_rating: 4,
    latitude: 16.0691,
    longitude: 108.2458,
    phone: '02363959555',
    website: 'https://alacartedanangbeach.com',
    booking_url: 'https://dananggo.vn/luu-tru/a-la-carte-danang-beach',
    promo_label: 'Hồ bơi vô cực tầng thượng',
    avg_rating: 4.7,
    review_count: 1420,
    view_count: 4700,
    cover_image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=80'
    ],
    amenity_names: ['Wi-Fi miễn phí', 'Hồ bơi', 'Bữa sáng', 'Điều hòa', 'Gần biển', 'Chỗ đậu xe'],
    rooms: [
      {
        name: 'Light Studio Apartment',
        description: 'Căn hộ studio hiện đại có khu bếp nhỏ và bàn ăn ấm cúng.',
        price_per_night: 950000,
        original_price: 1200000,
        capacity: 2,
        bed_type: '1 Giường Queen',
        total_rooms: 12
      },
      {
        name: 'Delight Ocean View 1-Bedroom',
        description: 'Căn hộ 1 phòng ngủ riêng biệt có ban công nhìn thẳng ra bãi biển Mỹ Khê.',
        price_per_night: 1450000,
        original_price: 1800000,
        capacity: 2,
        bed_type: '1 Giường King',
        total_rooms: 10
      },
      {
        name: 'Highlight Family 2-Bedroom Suite',
        description: 'Căn hộ góc 2 phòng ngủ rộng 72m2 ngập tràn nắng biển cho gia đình 4-6 người.',
        price_per_night: 2200000,
        original_price: 2750000,
        capacity: 6,
        bed_type: '2 Giường King + Sofa Bed',
        total_rooms: 6
      }
    ]
  },
  {
    name: 'Mercure Danang French Village Bana Hills',
    description: 'Khu nghỉ dưỡng 4 sao mang kiến trúc Làng Pháp cổ điển châu Âu thế kỷ 19 trên đỉnh Bà Nà Hills quanh năm mây phủ.',
    address: 'Đỉnh Núi Chúa Bà Nà Hills, Hòa Ninh',
    district_name: 'Hòa Vang',
    accommodation_type: 'RESORT',
    star_rating: 4,
    latitude: 15.9975,
    longitude: 107.9892,
    phone: '02363799888',
    website: 'https://mercure-danang-banahills.com',
    booking_url: 'https://dananggo.vn/luu-tru/mercure-bana-hills',
    promo_label: 'Nghỉ dưỡng trên mây',
    avg_rating: 4.8,
    review_count: 1620,
    view_count: 5400,
    cover_image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1200&q=80'
    ],
    amenity_names: ['Wi-Fi miễn phí', 'Hồ bơi', 'Bữa sáng', 'Điều hòa'],
    rooms: [
      {
        name: 'Standard French Village Room',
        description: 'Phòng ấm áp phong cách gothic Pháp với cửa sổ nhìn ra quảng trường Làng Pháp.',
        price_per_night: 1550000,
        original_price: 1950000,
        capacity: 2,
        bed_type: '1 Giường Queen',
        total_rooms: 15
      },
      {
        name: 'Deluxe Mountain Cloud View',
        description: 'Ngắm bình minh trên biển mây Bà Nà và ưu tiên tham quan Cầu Vàng chuyến sớm.',
        price_per_night: 2100000,
        original_price: 2600000,
        capacity: 2,
        bed_type: '1 Giường King',
        total_rooms: 10
      },
      {
        name: 'Family Bunk Suite Làng Pháp',
        description: 'Phòng gia đình có giường đôi lớn và giường tầng gỗ đáng yêu cho bé.',
        price_per_night: 2850000,
        original_price: 3400000,
        capacity: 4,
        bed_type: '1 Giường King + Giường Tầng',
        total_rooms: 6
      }
    ]
  },
  {
    name: 'Danang Backpackers Beach Hostel',
    description: 'Hostel năng động cách bãi biển Mỹ Khê 200m, không gian giao lưu quốc tế sôi động với quầy bar sân thượng và mức giá siêu tiết kiệm.',
    address: '14 An Thượng 2, Mỹ An',
    district_name: 'Ngũ Hành Sơn',
    accommodation_type: 'HOSTEL',
    star_rating: 1,
    latitude: 16.0508,
    longitude: 108.2454,
    phone: '0905141414',
    website: 'https://danangbackpackers.dananggo.vn',
    booking_url: 'https://dananggo.vn/luu-tru/danang-backpackers-hostel',
    promo_label: 'Chỉ từ 150k/đêm',
    avg_rating: 4.5,
    review_count: 520,
    view_count: 2300,
    cover_image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=1200&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=80'
    ],
    amenity_names: ['Wi-Fi miễn phí', 'Điều hòa', 'Gần biển', 'Bữa sáng'],
    rooms: [
      {
        name: 'Giường Dorm Capsule Riêng Tư',
        description: 'Giường tầng dạng kén có rèm che, đèn đọc sách, ổ cắm riêng và tủ khóa từ.',
        price_per_night: 150000,
        original_price: 200000,
        capacity: 1,
        bed_type: '1 Giường Đơn Capsule',
        total_rooms: 16
      },
      {
        name: 'Phòng Đôi Riêng Backpacker',
        description: 'Phòng riêng 2 người có phòng tắm khép kín và ban công thoáng mát.',
        price_per_night: 290000,
        original_price: 360000,
        capacity: 2,
        bed_type: '1 Giường Queen',
        total_rooms: 5
      }
    ]
  },
  {
    name: 'Thanh Bình Central Hotel',
    description: 'Khách sạn 3 sao tiện nghi ngay trung tâm quận Thanh Khê, cách sân bay quốc tế Đà Nẵng và ga tàu chỉ 5 phút di chuyển.',
    address: '245 Điện Biên Phủ, Chính Gián',
    district_name: 'Thanh Khê',
    accommodation_type: 'HOTEL',
    star_rating: 3,
    latitude: 16.0658,
    longitude: 108.1984,
    phone: '02363722888',
    website: 'https://thanhbinhhotel.dananggo.vn',
    booking_url: 'https://dananggo.vn/luu-tru/thanh-binh-central-hotel',
    promo_label: 'Gần sân bay & trung tâm',
    avg_rating: 4.6,
    review_count: 410,
    view_count: 1750,
    cover_image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80'
    ],
    amenity_names: ['Wi-Fi miễn phí', 'Bữa sáng', 'Điều hòa', 'Đưa đón sân bay', 'Chỗ đậu xe'],
    rooms: [
      {
        name: 'Standard City View',
        description: 'Phòng tiêu chuẩn 3 sao sạch đẹp, cách âm tốt, thuận tiện đi công tác và du lịch.',
        price_per_night: 380000,
        original_price: 480000,
        capacity: 2,
        bed_type: '1 Giường Queen',
        total_rooms: 12
      },
      {
        name: 'Deluxe Twin Room',
        description: 'Phòng 2 giường đơn rộng rãi kèm buffet sáng món địa phương Đà Nẵng.',
        price_per_night: 520000,
        original_price: 650000,
        capacity: 2,
        bed_type: '2 Giường Đơn',
        total_rooms: 10
      },
      {
        name: 'Family Triple Suite',
        description: 'Phòng lớn cho gia đình 3-4 người có xe đưa đón sân bay tiện lợi.',
        price_per_night: 750000,
        original_price: 920000,
        capacity: 4,
        bed_type: '2 Giường Đôi',
        total_rooms: 6
      }
    ]
  }
];

// Bổ sung thông tin chuẩn (tọa độ, star_rating, giờ nhận/trả phòng, tiện nghi) cho 15 nơi lưu trú đối tác có sẵn (place_id 377..391)
const EXISTING_PARTNER_STAY_ENRICHMENTS: {
  place_id: number;
  star_rating: number;
  latitude: number;
  longitude: number;
  amenity_Ids: number[];
}[] = [
  { place_id: 377, star_rating: 5, latitude: 16.0394, longitude: 108.2512, amenity_Ids: [1, 2, 3, 4, 5, 6, 7] }, // Furama Resort Danang
  { place_id: 378, star_rating: 5, latitude: 15.9892, longitude: 108.2715, amenity_Ids: [1, 2, 3, 4, 5, 6, 7] }, // Naman Retreat
  { place_id: 379, star_rating: 5, latitude: 16.0321, longitude: 108.2534, amenity_Ids: [1, 2, 3, 4, 5, 6, 7] }, // TIA Wellness Resort
  { place_id: 380, star_rating: 2, latitude: 16.0552, longitude: 108.2451, amenity_Ids: [1, 2, 4, 6, 7] },       // Rom Casa Hostel
  { place_id: 381, star_rating: 2, latitude: 16.0641, longitude: 108.2098, amenity_Ids: [1, 4, 6] },             // Scala Hostel
  { place_id: 382, star_rating: 2, latitude: 16.0672, longitude: 108.2185, amenity_Ids: [1, 3, 4, 6] },          // The Backpacker Hostel & Spa
  { place_id: 383, star_rating: 3, latitude: 16.0588, longitude: 108.2412, amenity_Ids: [1, 4, 6, 7] },          // Mộc House Homestay
  { place_id: 384, star_rating: 3, latitude: 16.0685, longitude: 108.2211, amenity_Ids: [1, 3, 4, 6] },          // Banana Flower Homestay
  { place_id: 385, star_rating: 4, latitude: 16.0715, longitude: 108.2239, amenity_Ids: [1, 3, 4, 5, 6] },       // Little Flower Homestay
  { place_id: 386, star_rating: 3, latitude: 16.0548, longitude: 108.2458, amenity_Ids: [1, 3, 4, 6, 7] },       // Dolphin Hotel and Apartment
  { place_id: 387, star_rating: 4, latitude: 16.0615, longitude: 108.2432, amenity_Ids: [1, 2, 4, 6, 7] },       // Sanayen Villa & Residences
  { place_id: 388, star_rating: 4, latitude: 16.0528, longitude: 108.2448, amenity_Ids: [1, 2, 3, 4, 6, 7] },    // Lantana House Boutique Da Nang
  { place_id: 389, star_rating: 4, latitude: 16.0618, longitude: 108.2465, amenity_Ids: [1, 2, 3, 4, 5, 6, 7] }, // Sala Danang Beach Hotel
  { place_id: 390, star_rating: 4, latitude: 16.0564, longitude: 108.2469, amenity_Ids: [1, 2, 3, 4, 5, 6, 7] }, // HAIAN Beach Hotel & Spa
  { place_id: 391, star_rating: 4, latitude: 16.0642, longitude: 108.2462, amenity_Ids: [1, 2, 3, 4, 5, 6, 7] }, // Monarque Hotel Danang
];

interface CatalogSeedItem {
  slug: string;
  kind: 'STAY' | 'FOOD' | 'ATTRACTION' | 'ENTERTAINMENT';
  name: string;
  description: string;
  address: string;
  price: number;
  accommodation_type: string | null;
  stars: number | null;
  meal_period: 'BREAKFAST' | 'LUNCH' | 'SNACK' | 'DINNER' | null;
  image_url: string;
  opening_time: string | null;
  closing_time: string | null;
  visit_duration_minutes: number | null;
  price_basis: 'PER_PERSON' | 'PER_ROOM';
  preferences: string[];
}

const SEED_ITINERARY_CATALOG: CatalogSeedItem[] = [
  // --- LƯU TRÚ (STAY): KHÁCH SẠN, HOMESTAY, RESORT, CẮM TRẠI ---
  {
    slug: 'homestay-nam-o-3',
    kind: 'STAY',
    name: 'Nam Ô Coastal Village Homestay',
    description: 'Homestay ven vịnh Nguyễn Tất Thành gần rạn Nam Ô, giá tiết kiệm cho du khách tự túc.',
    address: 'Liên Chiểu, Đà Nẵng',
    price: 200000,
    accommodation_type: 'Homestay',
    stars: 3,
    meal_period: null,
    image_url: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=600&q=80',
    opening_time: null,
    closing_time: null,
    visit_duration_minutes: null,
    price_basis: 'PER_PERSON',
    preferences: ['Biển & Nghỉ dưỡng', 'Phiêu lưu mạo hiểm']
  },
  {
    slug: 'homestay-han-market-3',
    kind: 'STAY',
    name: 'Han Market Homestay',
    description: 'Homestay gần chợ Hàn trung tâm thành phố; thuận tiện khám phá ẩm thực.',
    address: 'Hải Châu, Đà Nẵng',
    price: 250000,
    accommodation_type: 'Homestay',
    stars: 3,
    meal_period: null,
    image_url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=80',
    opening_time: null,
    closing_time: null,
    visit_duration_minutes: null,
    price_basis: 'PER_PERSON',
    preferences: ['Ẩm thực địa phương', 'Di sản & Văn hoá']
  },
  {
    slug: 'homestay-old-town-3',
    kind: 'STAY',
    name: 'Old Town & Cẩm Lệ Garden Homestay',
    description: 'Homestay nhà vườn yên tĩnh phong cách cổ điển bên bờ sông.',
    address: 'Cẩm Lệ, Đà Nẵng',
    price: 260000,
    accommodation_type: 'Homestay',
    stars: 3,
    meal_period: null,
    image_url: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=600&q=80',
    opening_time: null,
    closing_time: null,
    visit_duration_minutes: null,
    price_basis: 'PER_PERSON',
    preferences: ['Di sản & Văn hoá', 'Biển & Nghỉ dưỡng']
  },
  {
    slug: 'homestay-my-an-3',
    kind: 'STAY',
    name: 'An Thượng Beach Homestay',
    description: 'Homestay thoáng mát khu phố biển An Thượng, đi bộ ra biển Mỹ Khê 3 phút.',
    address: 'Ngũ Hành Sơn, Đà Nẵng',
    price: 280000,
    accommodation_type: 'Homestay',
    stars: 3,
    meal_period: null,
    image_url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=80',
    opening_time: null,
    closing_time: null,
    visit_duration_minutes: null,
    price_basis: 'PER_PERSON',
    preferences: ['Biển & Nghỉ dưỡng', 'Check-in sống ảo']
  },
  {
    slug: 'homestay-sea-breeze-3',
    kind: 'STAY',
    name: 'Sơn Trà Sea Breeze Homestay',
    description: 'Homestay gần bãi biển Phước Mỹ và bán đảo Sơn Trà, không gian ấm cúng.',
    address: 'Sơn Trà, Đà Nẵng',
    price: 320000,
    accommodation_type: 'Homestay',
    stars: 3,
    meal_period: null,
    image_url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80',
    opening_time: null,
    closing_time: null,
    visit_duration_minutes: null,
    price_basis: 'PER_PERSON',
    preferences: ['Biển & Nghỉ dưỡng']
  },
  {
    slug: 'homestay-beach-4',
    kind: 'STAY',
    name: 'Mỹ Khê Boho Chic Homestay',
    description: 'Homestay phong cách Bohemian sát biển Mỹ Khê, góc sống ảo cực chất.',
    address: 'Sơn Trà, Đà Nẵng',
    price: 350000,
    accommodation_type: 'Homestay',
    stars: 4,
    meal_period: null,
    image_url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80',
    opening_time: null,
    closing_time: null,
    visit_duration_minutes: null,
    price_basis: 'PER_PERSON',
    preferences: ['Biển & Nghỉ dưỡng', 'Check-in sống ảo']
  },
  {
    slug: 'homestay-han-river-4',
    kind: 'STAY',
    name: 'Han River View Boutique Homestay',
    description: 'Homestay có ban công nhìn ra sông Hàn và cầu Rồng, thiết kế Indochine tinh tế.',
    address: 'Hải Châu, Đà Nẵng',
    price: 380000,
    accommodation_type: 'Homestay',
    stars: 4,
    meal_period: null,
    image_url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&q=80',
    opening_time: null,
    closing_time: null,
    visit_duration_minutes: null,
    price_basis: 'PER_PERSON',
    preferences: ['Check-in sống ảo', 'Di sản & Văn hoá']
  },
  {
    slug: 'homestay-non-nuoc-4',
    kind: 'STAY',
    name: 'Non Nước Zen Garden Homestay',
    description: 'Homestay sân vườn dưới chân núi Ngũ Hành Sơn và bãi biển Non Nước.',
    address: 'Ngũ Hành Sơn, Đà Nẵng',
    price: 420000,
    accommodation_type: 'Homestay',
    stars: 4,
    meal_period: null,
    image_url: 'https://images.unsplash.com/photo-1540518614846-7ede433c4ef1?w=600&q=80',
    opening_time: null,
    closing_time: null,
    visit_duration_minutes: null,
    price_basis: 'PER_PERSON',
    preferences: ['Biển & Nghỉ dưỡng', 'Di sản & Văn hoá']
  },
  {
    slug: 'homestay-garden-5',
    kind: 'STAY',
    name: 'The Lena Pool Villa & Homestay',
    description: 'Homestay cao cấp có hồ bơi nước mặn và sân vườn nhiệt đới trung tâm Hải Châu.',
    address: 'Hải Châu, Đà Nẵng',
    price: 480000,
    accommodation_type: 'Homestay',
    stars: 5,
    meal_period: null,
    image_url: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&q=80',
    opening_time: null,
    closing_time: null,
    visit_duration_minutes: null,
    price_basis: 'PER_PERSON',
    preferences: ['Biển & Nghỉ dưỡng', 'Check-in sống ảo']
  },
  {
    slug: 'hotel-thanh-binh-3',
    kind: 'STAY',
    name: 'Thanh Bình Central Hotel',
    description: 'Khách sạn 3 sao phổ thông khu vực trung tâm, gần sân bay và cầu Sông Hàn.',
    address: 'Thanh Khê, Đà Nẵng',
    price: 350000,
    accommodation_type: 'Khách sạn',
    stars: 3,
    meal_period: null,
    image_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80',
    opening_time: null,
    closing_time: null,
    visit_duration_minutes: null,
    price_basis: 'PER_PERSON',
    preferences: ['Ẩm thực địa phương']
  },
  {
    slug: 'hotel-sea-light-3',
    kind: 'STAY',
    name: 'Sea Light Beach Hotel',
    description: 'Khách sạn 3 sao khu vực biển Sơn Trà; cách bãi tắm Mỹ Khê 5 phút.',
    address: 'Sơn Trà, Đà Nẵng',
    price: 400000,
    accommodation_type: 'Khách sạn',
    stars: 3,
    meal_period: null,
    image_url: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&q=80',
    opening_time: null,
    closing_time: null,
    visit_duration_minutes: null,
    price_basis: 'PER_PERSON',
    preferences: ['Biển & Nghỉ dưỡng']
  },
  {
    slug: 'hotel-riverside-3',
    kind: 'STAY',
    name: 'Riverside Boutique Hotel',
    description: 'Khách sạn boutique 3 sao gần sông Hàn; thuận tiện ngắm cầu Rồng phun lửa.',
    address: 'Hải Châu, Đà Nẵng',
    price: 450000,
    accommodation_type: 'Khách sạn',
    stars: 3,
    meal_period: null,
    image_url: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=600&q=80',
    opening_time: null,
    closing_time: null,
    visit_duration_minutes: null,
    price_basis: 'PER_PERSON',
    preferences: ['Check-in sống ảo', 'Di sản & Văn hoá']
  },
  {
    slug: 'hotel-han-river-4',
    kind: 'STAY',
    name: 'Sala Danang Beach Hotel',
    description: 'Khách sạn 4 sao sát biển Mỹ Khê với hồ bơi vô cực tầng thượng.',
    address: 'Ngũ Hành Sơn, Đà Nẵng',
    price: 650000,
    accommodation_type: 'Khách sạn',
    stars: 4,
    meal_period: null,
    image_url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&q=80',
    opening_time: null,
    closing_time: null,
    visit_duration_minutes: null,
    price_basis: 'PER_PERSON',
    preferences: ['Biển & Nghỉ dưỡng', 'Check-in sống ảo']
  },
  {
    slug: 'hotel-my-khe-4',
    kind: 'STAY',
    name: 'HAIAN Beach Hotel & Spa',
    description: 'Khách sạn 4 sao mặt biển Võ Nguyên Giáp, dịch vụ trà chiều và hồ bơi vô cực.',
    address: 'Ngũ Hành Sơn, Đà Nẵng',
    price: 750000,
    accommodation_type: 'Khách sạn',
    stars: 4,
    meal_period: null,
    image_url: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=600&q=80',
    opening_time: null,
    closing_time: null,
    visit_duration_minutes: null,
    price_basis: 'PER_PERSON',
    preferences: ['Biển & Nghỉ dưỡng', 'Check-in sống ảo']
  },
  {
    slug: 'hotel-grand-5',
    kind: 'STAY',
    name: 'Novotel Danang Premier Han River',
    description: 'Khách sạn 5 sao quốc tế bên bờ sông Hàn, tầm nhìn toàn cảnh thành phố.',
    address: 'Hải Châu, Đà Nẵng',
    price: 1650000,
    accommodation_type: 'Khách sạn',
    stars: 5,
    meal_period: null,
    image_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80',
    opening_time: null,
    closing_time: null,
    visit_duration_minutes: null,
    price_basis: 'PER_ROOM',
    preferences: ['Check-in sống ảo', 'Biển & Nghỉ dưỡng']
  },
  {
    slug: 'resort-green-3',
    kind: 'STAY',
    name: 'Green Bay Sơn Trà Resort',
    description: 'Resort nghỉ dưỡng xanh mát hướng vịnh Sơn Trà.',
    address: 'Sơn Trà, Đà Nẵng',
    price: 650000,
    accommodation_type: 'Resort',
    stars: 3,
    meal_period: null,
    image_url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&q=80',
    opening_time: null,
    closing_time: null,
    visit_duration_minutes: null,
    price_basis: 'PER_PERSON',
    preferences: ['Biển & Nghỉ dưỡng']
  },
  {
    slug: 'resort-ocean-4',
    kind: 'STAY',
    name: 'Mercure French Village Bana Hills',
    description: 'Resort 4 sao phong cách Làng Pháp cổ kính trên đỉnh núi Bà Nà.',
    address: 'Hòa Vang, Đà Nẵng',
    price: 1550000,
    accommodation_type: 'Resort',
    stars: 4,
    meal_period: null,
    image_url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&q=80',
    opening_time: null,
    closing_time: null,
    visit_duration_minutes: null,
    price_basis: 'PER_ROOM',
    preferences: ['Check-in sống ảo', 'Phiêu lưu mạo hiểm']
  },
  {
    slug: 'resort-peninsula-5',
    kind: 'STAY',
    name: 'Furama Resort Danang',
    description: 'Resort 5 sao di sản ẩm thực và biển Bắc Mỹ An sang trọng.',
    address: 'Ngũ Hành Sơn, Đà Nẵng',
    price: 2500000,
    accommodation_type: 'Resort',
    stars: 5,
    meal_period: null,
    image_url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&q=80',
    opening_time: null,
    closing_time: null,
    visit_duration_minutes: null,
    price_basis: 'PER_ROOM',
    preferences: ['Biển & Nghỉ dưỡng', 'Check-in sống ảo']
  },
  {
    slug: 'camping-son-tra-3',
    kind: 'STAY',
    name: 'Hòa Bắc Eco Valley Camping & Stay',
    description: 'Khu cắm trại và bungalow sinh thái bên dòng sông Cu Đê.',
    address: 'Hòa Vang, Đà Nẵng',
    price: 250000,
    accommodation_type: 'Cắm trại',
    stars: 3,
    meal_period: null,
    image_url: 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=600&q=80',
    opening_time: null,
    closing_time: null,
    visit_duration_minutes: null,
    price_basis: 'PER_PERSON',
    preferences: ['Phiêu lưu mạo hiểm', 'Check-in sống ảo']
  },

  // --- ẨM THỰC (FOOD): BREAKFAST, LUNCH, SNACK, DINNER ---
  {
    slug: 'banh-mi-ba-lan',
    kind: 'FOOD',
    name: 'Bánh mì Bà Lan',
    description: 'Bánh mì pate chả bò đặc sản Đà Nẵng giòn rụm cho bữa sáng năng lượng.',
    address: '62 Trưng Nữ Vương, Hải Châu, Đà Nẵng',
    price: 30000,
    accommodation_type: null,
    stars: null,
    meal_period: 'BREAKFAST',
    image_url: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=600&q=80',
    opening_time: '06:00',
    closing_time: '10:30',
    visit_duration_minutes: 30,
    price_basis: 'PER_PERSON',
    preferences: ['Ẩm thực địa phương']
  },
  {
    slug: 'bun-cha-ca-hon-sang',
    kind: 'FOOD',
    name: 'Bún Chả Cá Hờn',
    description: 'Bún chả cá thu gia truyền nước dùng ngọt thanh cho bữa sáng đậm vị biển.',
    address: '113/3 Nguyễn Chí Thanh, Hải Châu, Đà Nẵng',
    price: 45000,
    accommodation_type: null,
    stars: null,
    meal_period: 'BREAKFAST',
    image_url: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600&q=80',
    opening_time: '06:00',
    closing_time: '21:00',
    visit_duration_minutes: 40,
    price_basis: 'PER_PERSON',
    preferences: ['Ẩm thực địa phương']
  },
  {
    slug: 'mi-quang-1a-sang',
    kind: 'FOOD',
    name: 'Mì Quảng 1A Hải Phòng',
    description: 'Mì Quảng tôm thịt trứng cút truyền thống nổi tiếng bậc nhất Đà Nẵng.',
    address: '1A Hải Phòng, Hải Châu, Đà Nẵng',
    price: 45000,
    accommodation_type: null,
    stars: null,
    meal_period: 'BREAKFAST',
    image_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&q=80',
    opening_time: '06:00',
    closing_time: '21:00',
    visit_duration_minutes: 40,
    price_basis: 'PER_PERSON',
    preferences: ['Ẩm thực địa phương']
  },
  {
    slug: 'mi-hoanh-thanh-tau-bay',
    kind: 'FOOD',
    name: 'Mì Hoành Thánh Tàu Bay',
    description: 'Mì trứng tươi và hoành thánh xá xíu gia truyền hơn 50 năm.',
    address: '215 Trần Cao Vân, Thanh Khê, Đà Nẵng',
    price: 50000,
    accommodation_type: null,
    stars: null,
    meal_period: 'BREAKFAST',
    image_url: 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=600&q=80',
    opening_time: '06:00',
    closing_time: '21:00',
    visit_duration_minutes: 40,
    price_basis: 'PER_PERSON',
    preferences: ['Ẩm thực địa phương']
  },
  {
    slug: 'com-nieu-nha-do-trua',
    kind: 'FOOD',
    name: 'Cơm Niêu Nhà Đỏ Đà Nẵng',
    description: 'Cơm niêu đập giòn ăn cùng cá bống sông Trà kho tộ và canh cua đồng.',
    address: '86 Nguyễn Tri Phương, Thanh Khê, Đà Nẵng',
    price: 90000,
    accommodation_type: null,
    stars: null,
    meal_period: 'LUNCH',
    image_url: 'https://images.unsplash.com/photo-1543353071-873f17a7a088?w=600&q=80',
    opening_time: '10:00',
    closing_time: '21:30',
    visit_duration_minutes: 60,
    price_basis: 'PER_PERSON',
    preferences: ['Ẩm thực địa phương', 'Di sản & Văn hoá']
  },
  {
    slug: 'dac-san-tran-trua',
    kind: 'FOOD',
    name: 'Đặc Sản Trần - Bánh Tráng Cuốn Thịt Heo',
    description: 'Bánh tráng phơi sương cuốn thịt heo hai đầu da và mắm nêm trứ danh.',
    address: '04 Lê Duẩn, Hải Châu, Đà Nẵng',
    price: 115000,
    accommodation_type: null,
    stars: null,
    meal_period: 'LUNCH',
    image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80',
    opening_time: '09:30',
    closing_time: '22:00',
    visit_duration_minutes: 60,
    price_basis: 'PER_PERSON',
    preferences: ['Ẩm thực địa phương']
  },
  {
    slug: 'be-thui-cau-mong-muoi',
    kind: 'FOOD',
    name: 'Bê Thui Cầu Mống Mười',
    description: 'Đặc sản bê thui rơm da giòn thịt mềm cuốn rau rừng chấm mắm cái.',
    address: '138 Nguyễn Hữu Thọ, Cẩm Lệ, Đà Nẵng',
    price: 125000,
    accommodation_type: null,
    stars: null,
    meal_period: 'LUNCH',
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80',
    opening_time: '09:30',
    closing_time: '22:00',
    visit_duration_minutes: 60,
    price_basis: 'PER_PERSON',
    preferences: ['Ẩm thực địa phương']
  },
  {
    slug: 'cao-lau-hoi-an-giao-luu',
    kind: 'FOOD',
    name: 'Cao Lầu Hội An Giao Lưu',
    description: 'Cao lầu xá xíu chuẩn vị Hội An và hoành thánh chiên giòn.',
    address: '88 Phạm Văn Đồng, Sơn Trà, Đà Nẵng',
    price: 55000,
    accommodation_type: null,
    stars: null,
    meal_period: 'LUNCH',
    image_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&q=80',
    opening_time: '06:30',
    closing_time: '21:30',
    visit_duration_minutes: 45,
    price_basis: 'PER_PERSON',
    preferences: ['Ẩm thực địa phương', 'Di sản & Văn hoá']
  },
  {
    slug: 'che-sau-lien-chieu',
    kind: 'FOOD',
    name: 'Chè Sầu Liên Đà Nẵng',
    description: 'Chè Thái sầu riêng và tàu hũ đá cốt dừa mát lạnh cho bữa xế chiều.',
    address: '189 Hoàng Diệu, Hải Châu, Đà Nẵng',
    price: 35000,
    accommodation_type: null,
    stars: null,
    meal_period: 'SNACK',
    image_url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80',
    opening_time: '08:00',
    closing_time: '22:30',
    visit_duration_minutes: 35,
    price_basis: 'PER_PERSON',
    preferences: ['Ẩm thực địa phương']
  },
  {
    slug: 'banh-trang-kep-di-hoa',
    kind: 'FOOD',
    name: 'Bánh Tráng Kẹp Dì Hoa',
    description: 'Bánh tráng kẹp pate trứng nướng than hồng và ốc hút cay nồng.',
    address: '62/2A Núi Thành, Hải Châu, Đà Nẵng',
    price: 35000,
    accommodation_type: null,
    stars: null,
    meal_period: 'SNACK',
    image_url: 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=600&q=80',
    opening_time: '14:30',
    closing_time: '22:00',
    visit_duration_minutes: 40,
    price_basis: 'PER_PERSON',
    preferences: ['Ẩm thực địa phương']
  },
  {
    slug: 'son-tra-marina-cafe',
    kind: 'FOOD',
    name: 'Sơn Trà Marina Café & Lounge',
    description: 'Thưởng thức cà phê muối, bánh ngọt và ngắm hoàng hôn vịnh biển.',
    address: 'Hoàng Sa, Sơn Trà, Đà Nẵng',
    price: 65000,
    accommodation_type: null,
    stars: null,
    meal_period: 'SNACK',
    image_url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&q=80',
    opening_time: '07:00',
    closing_time: '22:00',
    visit_duration_minutes: 60,
    price_basis: 'PER_PERSON',
    preferences: ['Check-in sống ảo', 'Biển & Nghỉ dưỡng']
  },
  {
    slug: 'banh-xeo-ba-duong',
    kind: 'FOOD',
    name: 'Bánh Xèo Bà Dưỡng',
    description: 'Bánh xèo tôm thịt giòn rụm và nem lụi chấm tương gan heo đặc sản.',
    address: 'K280/23 Hoàng Diệu, Hải Châu, Đà Nẵng',
    price: 70000,
    accommodation_type: null,
    stars: null,
    meal_period: 'DINNER',
    image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80',
    opening_time: '09:30',
    closing_time: '21:30',
    visit_duration_minutes: 60,
    price_basis: 'PER_PERSON',
    preferences: ['Ẩm thực địa phương']
  },
  {
    slug: 'lau-ca-cu-song-han',
    kind: 'FOOD',
    name: 'Lẩu Cá Cu Sông Hàn',
    description: 'Lẩu cá cu biển nấu măng chua cay nồng ấm bụng buổi tối bên sông Hàn.',
    address: '158 Trần Hưng Đạo, Sơn Trà, Đà Nẵng',
    price: 150000,
    accommodation_type: null,
    stars: null,
    meal_period: 'DINNER',
    image_url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&q=80',
    opening_time: '10:30',
    closing_time: '23:00',
    visit_duration_minutes: 75,
    price_basis: 'PER_PERSON',
    preferences: ['Ẩm thực địa phương', 'Biển & Nghỉ dưỡng']
  },
  {
    slug: 'hai-san-be-man',
    kind: 'FOOD',
    name: 'Hải Sản Bé Mặn Mỹ Khê',
    description: 'Hải sản tươi sống tự chọn ven biển Mỹ Khê, chip chip hấp sả và mực nướng.',
    address: 'Lô 11 Võ Nguyên Giáp, Sơn Trà, Đà Nẵng',
    price: 180000,
    accommodation_type: null,
    stars: null,
    meal_period: 'DINNER',
    image_url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&q=80',
    opening_time: '09:00',
    closing_time: '23:30',
    visit_duration_minutes: 90,
    price_basis: 'PER_PERSON',
    preferences: ['Ẩm thực địa phương', 'Biển & Nghỉ dưỡng']
  },
  {
    slug: 'banh-canh-ruong-phuong',
    kind: 'FOOD',
    name: 'Bánh Canh Ruộng Phương',
    description: 'Bánh canh cá nướng chả quẩy nóng hổi bình dân cho bữa tối nhẹ nhàng.',
    address: 'K27/03 Hà Thị Thân, Sơn Trà, Đà Nẵng',
    price: 35000,
    accommodation_type: null,
    stars: null,
    meal_period: 'DINNER',
    image_url: 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=600&q=80',
    opening_time: '14:00',
    closing_time: '22:00',
    visit_duration_minutes: 40,
    price_basis: 'PER_PERSON',
    preferences: ['Ẩm thực địa phương']
  },

  // --- ĐIỂM THAM QUAN (ATTRACTION) & GIẢI TRÍ (ENTERTAINMENT) ---
  {
    slug: 'my-khe-beach',
    kind: 'ATTRACTION',
    name: 'Bãi Biển Mỹ Khê',
    description: 'Bãi biển cát trắng mịn quyến rũ bậc nhất hành tinh, miễn phí tắm biển và dạo bộ.',
    address: 'Võ Nguyên Giáp, Sơn Trà, Đà Nẵng',
    price: 0,
    accommodation_type: null,
    stars: null,
    meal_period: null,
    image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
    opening_time: '05:00',
    closing_time: '22:00',
    visit_duration_minutes: 120,
    price_basis: 'PER_PERSON',
    preferences: ['Biển & Nghỉ dưỡng', 'Check-in sống ảo']
  },
  {
    slug: 'dragon-bridge',
    kind: 'ATTRACTION',
    name: 'Cầu Rồng & Cầu Tình Yêu Đà Nẵng',
    description: 'Biểu tượng kiến trúc bắc qua sông Hàn với màn trình diễn phun lửa cuối tuần.',
    address: 'Hải Châu, Đà Nẵng',
    price: 0,
    accommodation_type: null,
    stars: null,
    meal_period: null,
    image_url: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=600&q=80',
    opening_time: '00:00',
    closing_time: '23:59',
    visit_duration_minutes: 60,
    price_basis: 'PER_PERSON',
    preferences: ['Check-in sống ảo', 'Di sản & Văn hoá']
  },
  {
    slug: 'linh-ung-pagoda',
    kind: 'ATTRACTION',
    name: 'Bán Đảo Sơn Trà & Chùa Linh Ứng',
    description: 'Chùa Linh Ứng Bãi Bụt với tượng Phật Bà Quan Âm cao 67m hướng biển Đông.',
    address: 'Bán đảo Sơn Trà, Đà Nẵng',
    price: 0,
    accommodation_type: null,
    stars: null,
    meal_period: null,
    image_url: 'https://images.unsplash.com/photo-1546587348-d12660c30c50?w=600&q=80',
    opening_time: '06:00',
    closing_time: '18:30',
    visit_duration_minutes: 120,
    price_basis: 'PER_PERSON',
    preferences: ['Di sản & Văn hoá', 'Biển & Nghỉ dưỡng', 'Check-in sống ảo']
  },
  {
    slug: 'marble-mountains',
    kind: 'ATTRACTION',
    name: 'Danh Thắng Ngũ Hành Sơn',
    description: 'Quần thể 5 ngọn núi đá cẩm thạch, hang động Huyền Không và làng đá Non Nước.',
    address: '81 Huyền Trân Công Chúa, Ngũ Hành Sơn, Đà Nẵng',
    price: 40000,
    accommodation_type: null,
    stars: null,
    meal_period: null,
    image_url: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=600&q=80',
    opening_time: '07:00',
    closing_time: '17:30',
    visit_duration_minutes: 120,
    price_basis: 'PER_PERSON',
    preferences: ['Di sản & Văn hoá', 'Phiêu lưu mạo hiểm', 'Check-in sống ảo']
  },
  {
    slug: 'cham-museum',
    kind: 'ATTRACTION',
    name: 'Bảo Tàng Điêu Khắc Chăm Đà Nẵng',
    description: 'Bảo tàng lưu giữ cổ vật văn hóa Champa lớn nhất thế giới bên sông Hàn.',
    address: '02 Đường 2 Tháng 9, Hải Châu, Đà Nẵng',
    price: 60000,
    accommodation_type: null,
    stars: null,
    meal_period: null,
    image_url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=600&q=80',
    opening_time: '07:30',
    closing_time: '17:00',
    visit_duration_minutes: 90,
    price_basis: 'PER_PERSON',
    preferences: ['Di sản & Văn hoá']
  },
  {
    slug: 'son-tra-viewpoint',
    kind: 'ATTRACTION',
    name: 'Đỉnh Bàn Cờ - Bán Đảo Sơn Trà',
    description: 'Đỉnh núi cao 700m ngắm toàn cảnh thành phố và vịnh biển Đà Nẵng từ trên cao.',
    address: 'Thọ Quang, Sơn Trà, Đà Nẵng',
    price: 0,
    accommodation_type: null,
    stars: null,
    meal_period: null,
    image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80',
    opening_time: '06:00',
    closing_time: '18:00',
    visit_duration_minutes: 120,
    price_basis: 'PER_PERSON',
    preferences: ['Phiêu lưu mạo hiểm', 'Check-in sống ảo']
  },
  {
    slug: 'deo-hai-van',
    kind: 'ATTRACTION',
    name: 'Đèo Hải Vân & Hải Vân Quan',
    description: 'Cung đường đèo ven biển hùng vĩ và di tích lịch sử Hải Vân Quan.',
    address: 'Hòa Hiệp Bắc, Liên Chiểu, Đà Nẵng',
    price: 0,
    accommodation_type: null,
    stars: null,
    meal_period: null,
    image_url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80',
    opening_time: '05:30',
    closing_time: '18:30',
    visit_duration_minutes: 150,
    price_basis: 'PER_PERSON',
    preferences: ['Phiêu lưu mạo hiểm', 'Check-in sống ảo', 'Di sản & Văn hoá']
  },
  {
    slug: 'suoi-hoa-eco',
    kind: 'ATTRACTION',
    name: 'Khu Sinh Thái Suối Hoa Hòa Vang',
    description: 'Thác nước rừng nguyên sinh và thung lũng hoa dã ngoại mát lành.',
    address: 'Hòa Phú, Hòa Vang, Đà Nẵng',
    price: 100000,
    accommodation_type: null,
    stars: null,
    meal_period: null,
    image_url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=80',
    opening_time: '07:30',
    closing_time: '17:30',
    visit_duration_minutes: 180,
    price_basis: 'PER_PERSON',
    preferences: ['Phiêu lưu mạo hiểm', 'Biển & Nghỉ dưỡng']
  },
  {
    slug: 'asia-park',
    kind: 'ENTERTAINMENT',
    name: 'Công Viên Châu Á - Asia Park',
    description: 'Công viên giải trí và vòng quay Sun Wheel rực rỡ về đêm.',
    address: '01 Phan Đăng Lưu, Hải Châu, Đà Nẵng',
    price: 200000,
    accommodation_type: null,
    stars: null,
    meal_period: null,
    image_url: 'https://images.unsplash.com/photo-1513883049090-d0b7439799bf?w=600&q=80',
    opening_time: '15:00',
    closing_time: '22:00',
    visit_duration_minutes: 150,
    price_basis: 'PER_PERSON',
    preferences: ['Check-in sống ảo', 'Phiêu lưu mạo hiểm']
  },
  {
    slug: 'than-tai-hot-springs',
    kind: 'ENTERTAINMENT',
    name: 'Công Viên Suối Khoáng Nóng Núi Thần Tài',
    description: 'Khu nghỉ dưỡng tắm khoáng nóng, tắm bùn và công viên nước giữa núi rừng.',
    address: 'Hòa Phú, Hòa Vang, Đà Nẵng',
    price: 450000,
    accommodation_type: null,
    stars: null,
    meal_period: null,
    image_url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&q=80',
    opening_time: '08:00',
    closing_time: '17:30',
    visit_duration_minutes: 240,
    price_basis: 'PER_PERSON',
    preferences: ['Biển & Nghỉ dưỡng', 'Phiêu lưu mạo hiểm']
  },
  {
    slug: 'ba-na-hills',
    kind: 'ATTRACTION',
    name: 'Sun World Bà Nà Hills',
    description: 'Khám phá Cầu Vàng, Làng Pháp và khu vui chơi Fantasy Park trên đỉnh Núi Chúa.',
    address: 'Hòa Ninh, Hòa Vang, Đà Nẵng',
    price: 900000,
    accommodation_type: null,
    stars: null,
    meal_period: null,
    image_url: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=600&q=80',
    opening_time: '07:30',
    closing_time: '19:00',
    visit_duration_minutes: 360,
    price_basis: 'PER_PERSON',
    preferences: ['Check-in sống ảo', 'Phiêu lưu mạo hiểm']
  }
];

export async function runTask7Seed() {
  console.log('🚀 BẮT ĐẦU NẠP DỮ LIỆU ĐẦY ĐỦ CHO DANANGGO (NHÀ HÀNG + THỰC ĐƠN + HOMESTAY/LƯU TRÚ + ĐIỂM DU LỊCH + CATALOG)...');
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

  const amenRes = await pool.request().query<{ amenity_id: number; name: string }>('SELECT amenity_id, name FROM amenities');
  const amenityMap = new Map<string, number>(amenRes.recordset.map((r) => [r.name.trim().toLowerCase(), r.amenity_id]));

  console.log(`📋 Đã tải danh mục: ${districtMap.size} quận, ${cuisineMap.size} loại ẩm thực, ${tasteMap.size} khẩu vị, ${categoryMap.size} loại điểm du lịch, ${amenityMap.size} tiện nghi.`);

  // 2. Nạp hoặc cập nhật Nhà hàng (Restaurants) & Thực đơn (Menu Items + Tastes)
  console.log('\n--- 🍜 ĐANG NẠP DỮ LIỆU NHÀ HÀNG & THỰC ĐƠN ---');
  for (const r of SEED_RESTAURANTS) {
    const districtId = districtMap.get(r.district_name.trim().toLowerCase()) ?? 1;
    const cuisineId = cuisineMap.get(r.cuisine_name.trim().toLowerCase()) ?? 1;

    const checkRes = await pool.request().input('name', sql.NVarChar(200), r.name).query<{ place_id: number }>(`
      SELECT place_id FROM places WHERE name = @name AND place_type = 'RESTAURANT'
    `);

    let placeId: number;

    if (checkRes.recordset.length > 0) {
      placeId = checkRes.recordset[0].place_id;
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
            review_count = @review_count, view_count = @view_count, status = 'ACTIVE', updated_at = GETDATE()
          WHERE place_id = @place_id
        `);

      await pool.request()
        .input('place_id', sql.Int, placeId)
        .input('cuisine_id', sql.Int, cuisineId)
        .query('UPDATE restaurants SET cuisine_id = @cuisine_id WHERE place_id = @place_id');

      console.log(`  [Cập nhật] Nhà hàng: ${r.name} (place_id: ${placeId})`);
    } else {
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

      await pool.request()
        .input('place_id', sql.Int, placeId)
        .input('cuisine_id', sql.Int, cuisineId)
        .query(`
          INSERT INTO restaurants (place_id, place_type, cuisine_id, price_min, price_max)
          VALUES (@place_id, 'RESTAURANT', @cuisine_id, NULL, NULL)
        `);

      await pool.request()
        .input('place_id', sql.Int, placeId)
        .input('avg_rating', sql.Decimal(3, 2), r.avg_rating)
        .input('review_count', sql.Int, r.review_count)
        .input('view_count', sql.Int, r.view_count)
        .query('UPDATE places SET avg_rating = @avg_rating, review_count = @review_count, view_count = @view_count WHERE place_id = @place_id');

      console.log(`  [Thêm mới] Nhà hàng: ${r.name} (place_id: ${placeId})`);
    }

    // Lịch mở cửa
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

    // Thư viện ảnh
    await pool.request().input('place_id', sql.Int, placeId).query('DELETE FROM place_images WHERE place_id = @place_id');
    await pool.request()
      .input('place_id', sql.Int, placeId)
      .input('image_url', sql.VarChar(sql.MAX), r.cover_image)
      .input('is_cover', sql.Bit, 1)
      .query('INSERT INTO place_images (place_id, image_url, is_cover) VALUES (@place_id, @image_url, @is_cover)');

    for (const img of r.gallery_images) {
      await pool.request()
        .input('place_id', sql.Int, placeId)
        .input('image_url', sql.VarChar(sql.MAX), img)
        .input('is_cover', sql.Bit, 0)
        .query('INSERT INTO place_images (place_id, image_url, is_cover) VALUES (@place_id, @image_url, @is_cover)');
    }

    // Thực đơn món ăn
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

    await recalculateRestaurantPriceRange(placeId);
  }

  // 3. Chuẩn hóa 15 nơi lưu trú đối tác có sẵn (place_id 377..391) & Nạp thêm Lưu trú / Homestay mới
  console.log('\n--- 🏡 ĐANG CHUẨN HÓA & NẠP DỮ LIỆU LƯU TRÚ (HOMESTAY, KHÁCH SẠN, RESORT, HOSTEL, CĂN HỘ) ---');
  for (const enrich of EXISTING_PARTNER_STAY_ENRICHMENTS) {
    await pool.request()
      .input('place_id', sql.Int, enrich.place_id)
      .input('latitude', sql.Decimal(9, 6), enrich.latitude)
      .input('longitude', sql.Decimal(9, 6), enrich.longitude)
      .input('star_rating', sql.TinyInt, enrich.star_rating)
      .query(`
        UPDATE places
        SET latitude = COALESCE(latitude, @latitude),
            longitude = COALESCE(longitude, @longitude),
            updated_at = GETDATE()
        WHERE place_id = @place_id AND reference_key IS NULL;

        UPDATE accommodations
        SET star_rating = COALESCE(star_rating, @star_rating),
            check_in_time = COALESCE(check_in_time, '14:00'),
            check_out_time = COALESCE(check_out_time, '12:00')
        WHERE place_id = @place_id;
      `);

    for (const amenityId of enrich.amenity_Ids) {
      await pool.request()
        .input('place_id', sql.Int, enrich.place_id)
        .input('amenity_id', sql.Int, amenityId)
        .query(`
          IF NOT EXISTS (SELECT 1 FROM accommodation_amenities WHERE place_id = @place_id AND amenity_id = @amenity_id)
            INSERT INTO accommodation_amenities (place_id, amenity_id) VALUES (@place_id, @amenity_id)
        `);
    }
  }

  for (const acc of SEED_ACCOMMODATIONS) {
    const districtId = districtMap.get(acc.district_name.trim().toLowerCase()) ?? 1;

    const checkRes = await pool.request()
      .input('name', sql.NVarChar(200), acc.name)
      .query<{ place_id: number }>(`
        SELECT place_id FROM places WHERE name = @name AND place_type = 'ACCOMMODATION' AND reference_key IS NULL
      `);

    let placeId: number;

    if (checkRes.recordset.length > 0) {
      placeId = checkRes.recordset[0].place_id;
      await pool.request()
        .input('place_id', sql.Int, placeId)
        .input('description', sql.NVarChar(sql.MAX), acc.description)
        .input('address', sql.NVarChar(255), acc.address)
        .input('district_id', sql.Int, districtId)
        .input('latitude', sql.Decimal(9, 6), acc.latitude)
        .input('longitude', sql.Decimal(9, 6), acc.longitude)
        .input('phone', sql.VarChar(20), acc.phone)
        .input('website', sql.VarChar(255), acc.website)
        .input('booking_url', sql.NVarChar(500), acc.booking_url)
        .input('promo_label', sql.NVarChar(50), acc.promo_label)
        .input('avg_rating', sql.Decimal(3, 2), acc.avg_rating)
        .input('review_count', sql.Int, acc.review_count)
        .input('view_count', sql.Int, acc.view_count)
        .query(`
          UPDATE places SET
            description = @description, address = @address, district_id = @district_id,
            latitude = @latitude, longitude = @longitude, phone = @phone, website = @website,
            booking_url = @booking_url, promo_label = @promo_label, avg_rating = @avg_rating,
            review_count = @review_count, view_count = @view_count, status = 'ACTIVE', updated_at = GETDATE()
          WHERE place_id = @place_id
        `);

      await pool.request()
        .input('place_id', sql.Int, placeId)
        .input('accommodation_type', sql.VarChar(20), acc.accommodation_type)
        .input('star_rating', sql.TinyInt, acc.star_rating)
        .query(`
          UPDATE accommodations
          SET accommodation_type = @accommodation_type,
              star_rating = @star_rating,
              check_in_time = '14:00',
              check_out_time = '12:00'
          WHERE place_id = @place_id
        `);

      console.log(`  [Cập nhật] Lưu trú (${acc.accommodation_type}): ${acc.name} (place_id: ${placeId})`);
    } else {
      placeId = await createPlaceCommon({
        place_type: 'ACCOMMODATION',
        name: acc.name,
        description: acc.description,
        address: acc.address,
        district_id: districtId,
        latitude: acc.latitude,
        longitude: acc.longitude,
        phone: acc.phone,
        website: acc.website,
        booking_url: acc.booking_url,
        promo_label: acc.promo_label,
        status: 'ACTIVE'
      });

      await pool.request()
        .input('place_id', sql.Int, placeId)
        .input('accommodation_type', sql.VarChar(20), acc.accommodation_type)
        .input('star_rating', sql.TinyInt, acc.star_rating)
        .query(`
          INSERT INTO accommodations (place_id, place_type, accommodation_type, star_rating, check_in_time, check_out_time)
          VALUES (@place_id, 'ACCOMMODATION', @accommodation_type, @star_rating, '14:00', '12:00')
        `);

      await pool.request()
        .input('place_id', sql.Int, placeId)
        .input('avg_rating', sql.Decimal(3, 2), acc.avg_rating)
        .input('review_count', sql.Int, acc.review_count)
        .input('view_count', sql.Int, acc.view_count)
        .query('UPDATE places SET avg_rating = @avg_rating, review_count = @review_count, view_count = @view_count WHERE place_id = @place_id');

      console.log(`  [Thêm mới] Lưu trú (${acc.accommodation_type}): ${acc.name} (place_id: ${placeId})`);
    }

    // Lịch mở cửa 24/7 cho lưu trú
    await pool.request().input('place_id', sql.Int, placeId).query('DELETE FROM opening_hours WHERE place_id = @place_id');
    for (let day = 1; day <= 7; day++) {
      await pool.request()
        .input('place_id', sql.Int, placeId)
        .input('day_of_week', sql.TinyInt, day)
        .query(`
          INSERT INTO opening_hours (place_id, day_of_week, open_time, close_time)
          VALUES (@place_id, @day_of_week, '00:00:00', '23:59:00')
        `);
    }

    // Ảnh lưu trú
    await pool.request().input('place_id', sql.Int, placeId).query('DELETE FROM place_images WHERE place_id = @place_id');
    await pool.request()
      .input('place_id', sql.Int, placeId)
      .input('image_url', sql.VarChar(sql.MAX), acc.cover_image)
      .input('is_cover', sql.Bit, 1)
      .query('INSERT INTO place_images (place_id, image_url, is_cover) VALUES (@place_id, @image_url, @is_cover)');

    for (const img of acc.gallery_images) {
      await pool.request()
        .input('place_id', sql.Int, placeId)
        .input('image_url', sql.VarChar(sql.MAX), img)
        .input('is_cover', sql.Bit, 0)
        .query('INSERT INTO place_images (place_id, image_url, is_cover) VALUES (@place_id, @image_url, @is_cover)');
    }

    // Tiện nghi
    await pool.request().input('place_id', sql.Int, placeId).query('DELETE FROM accommodation_amenities WHERE place_id = @place_id');
    for (const aName of acc.amenity_names) {
      const aId = amenityMap.get(aName.trim().toLowerCase());
      if (aId) {
        await pool.request()
          .input('place_id', sql.Int, placeId)
          .input('amenity_id', sql.Int, aId)
          .query('INSERT INTO accommodation_amenities (place_id, amenity_id) VALUES (@place_id, @amenity_id)');
      }
    }

    // Các hạng phòng (room_types)
    for (const rm of acc.rooms) {
      const rmCheck = await pool.request()
        .input('place_id', sql.Int, placeId)
        .input('name', sql.NVarChar(100), rm.name)
        .query<{ room_type_id: number }>('SELECT room_type_id FROM room_types WHERE place_id = @place_id AND name = @name');

      if (rmCheck.recordset.length > 0) {
        await pool.request()
          .input('room_type_id', sql.Int, rmCheck.recordset[0].room_type_id)
          .input('price_per_night', sql.Decimal(18, 0), rm.price_per_night)
          .input('original_price', sql.Decimal(18, 0), rm.original_price)
          .input('capacity', sql.TinyInt, rm.capacity)
          .input('room_count', sql.Int, rm.total_rooms)
          .query(`
            UPDATE room_types
            SET price_per_night = @price_per_night,
                original_price = @original_price,
                capacity = @capacity,
                room_count = @room_count,
                status = 'ACTIVE'
            WHERE room_type_id = @room_type_id
          `);
      } else {
        await pool.request()
          .input('place_id', sql.Int, placeId)
          .input('name', sql.NVarChar(100), rm.name)
          .input('price_per_night', sql.Decimal(18, 0), rm.price_per_night)
          .input('original_price', sql.Decimal(18, 0), rm.original_price)
          .input('capacity', sql.TinyInt, rm.capacity)
          .input('room_count', sql.Int, rm.total_rooms)
          .query(`
            INSERT INTO room_types (place_id, name, capacity, price_per_night, original_price, room_count, status)
            VALUES (@place_id, @name, @capacity, @price_per_night, @original_price, @room_count, 'ACTIVE')
          `);
      }
    }
  }

  // 4. Nạp hoặc cập nhật Điểm du lịch (Attractions)
  console.log('\n--- 🏖️ ĐANG NẠP DỮ LIỆU ĐIỂM DU LỊCH ---');
  for (const a of SEED_ATTRACTIONS) {
    const districtId = districtMap.get(a.district_name.trim().toLowerCase()) ?? 1;
    const categoryId = categoryMap.get(a.category_name.trim().toLowerCase()) ?? 1;

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
            review_count = @review_count, view_count = @view_count, status = 'ACTIVE', updated_at = GETDATE()
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

    // Lịch mở cửa
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

    // Thư viện ảnh
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

  // 5. Nạp dữ liệu Danh mục Lịch trình & Tìm kiếm Ngân sách (itinerary_catalog_places & itinerary_catalog_preferences)
  console.log('\n--- 🗺️ ĐANG NẠP DỮ LIỆU CATALOG TÌM KIẾM & LỊCH TRÌNH THEO NGÂN SÁCH ---');
  for (const cat of SEED_ITINERARY_CATALOG) {
    const existingCat = await pool.request()
      .input('slug', sql.NVarChar(100), cat.slug)
      .query<{ id: number }>('SELECT id FROM dbo.itinerary_catalog_places WHERE slug = @slug');

    let catalogId: number;
    if (existingCat.recordset.length > 0) {
      catalogId = existingCat.recordset[0].id;
      await pool.request()
        .input('id', sql.Int, catalogId)
        .input('kind', sql.NVarChar(20), cat.kind)
        .input('name', sql.NVarChar(200), cat.name)
        .input('description', sql.NVarChar(1000), cat.description)
        .input('address', sql.NVarChar(300), cat.address)
        .input('price', sql.Decimal(18, 2), cat.price)
        .input('accommodation_type', sql.NVarChar(30), cat.accommodation_type)
        .input('stars', sql.TinyInt, cat.stars)
        .input('meal_period', sql.NVarChar(20), cat.meal_period)
        .input('image_url', sql.NVarChar(1000), cat.image_url)
        .input('opening_time', sql.VarChar(10), cat.opening_time)
        .input('closing_time', sql.VarChar(10), cat.closing_time)
        .input('visit_duration_minutes', sql.SmallInt, cat.visit_duration_minutes)
        .input('price_basis', sql.NVarChar(20), cat.price_basis)
        .query(`
          UPDATE dbo.itinerary_catalog_places
          SET kind = @kind, name = @name, description = @description, address = @address,
              price = @price, accommodation_type = @accommodation_type, stars = @stars,
              meal_period = @meal_period, image_url = @image_url, is_active = 1,
              opening_time = @opening_time, closing_time = @closing_time,
              visit_duration_minutes = @visit_duration_minutes, price_basis = @price_basis
          WHERE id = @id
        `);
    } else {
      const insertedCat = await pool.request()
        .input('slug', sql.NVarChar(100), cat.slug)
        .input('kind', sql.NVarChar(20), cat.kind)
        .input('name', sql.NVarChar(200), cat.name)
        .input('description', sql.NVarChar(1000), cat.description)
        .input('address', sql.NVarChar(300), cat.address)
        .input('price', sql.Decimal(18, 2), cat.price)
        .input('accommodation_type', sql.NVarChar(30), cat.accommodation_type)
        .input('stars', sql.TinyInt, cat.stars)
        .input('meal_period', sql.NVarChar(20), cat.meal_period)
        .input('image_url', sql.NVarChar(1000), cat.image_url)
        .input('opening_time', sql.VarChar(10), cat.opening_time)
        .input('closing_time', sql.VarChar(10), cat.closing_time)
        .input('visit_duration_minutes', sql.SmallInt, cat.visit_duration_minutes)
        .input('price_basis', sql.NVarChar(20), cat.price_basis)
        .query<{ id: number }>(`
          INSERT INTO dbo.itinerary_catalog_places
            (slug, kind, name, description, address, price, accommodation_type, stars, meal_period, image_url, is_active, opening_time, closing_time, visit_duration_minutes, price_basis)
          OUTPUT INSERTED.id
          VALUES
            (@slug, @kind, @name, @description, @address, @price, @accommodation_type, @stars, @meal_period, @image_url, 1, @opening_time, @closing_time, @visit_duration_minutes, @price_basis)
        `);
      catalogId = insertedCat.recordset[0].id;
    }

    await pool.request()
      .input('place_id', sql.Int, catalogId)
      .query('DELETE FROM dbo.itinerary_catalog_preferences WHERE place_id = @place_id');

    for (const pref of cat.preferences) {
      await pool.request()
        .input('place_id', sql.Int, catalogId)
        .input('preference', sql.NVarChar(100), pref)
        .query('INSERT INTO dbo.itinerary_catalog_preferences (place_id, preference) VALUES (@place_id, @preference)');
    }
  }

  // 6. Thống kê kết quả sau khi seed
  console.log('\n======================================================');
  console.log('🎉 TỔNG KẾT DỮ LIỆU ĐÃ SEED THÀNH CÔNG:');
  const countPlaces = await pool.request().query("SELECT place_type, status, COUNT(*) as c FROM places GROUP BY place_type, status ORDER BY place_type, status");
  console.table(countPlaces.recordset);
  const countAccTypes = await pool.request().query("SELECT a.accommodation_type, COUNT(*) as c FROM accommodations a JOIN places p ON p.place_id = a.place_id WHERE p.status = 'ACTIVE' GROUP BY a.accommodation_type");
  console.table(countAccTypes.recordset);
  const countMenu = await pool.request().query('SELECT COUNT(*) as c FROM menu_items');
  const countRooms = await pool.request().query('SELECT COUNT(*) as c FROM room_types');
  const countCatalog = await pool.request().query('SELECT COUNT(*) as c FROM itinerary_catalog_places');
  console.log(`- Món ăn (menu_items): ${countMenu.recordset[0].c}`);
  console.log(`- Hạng phòng (room_types): ${countRooms.recordset[0].c}`);
  console.log(`- Danh mục lịch trình & tìm kiếm (itinerary_catalog_places): ${countCatalog.recordset[0].c}`);
  console.log('======================================================\n');

  await closeDB();
}

if (require.main === module) {
  runTask7Seed().catch((err) => {
    console.error('Lỗi khi seed data:', err);
    process.exit(1);
  });
}
