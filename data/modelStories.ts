export interface ModelStoryContent {
  id: string;
  title: string;
  subtitle: string;
  year: string;
  description: string;
  meaning: string;
  keyMoments: string[];
  videoUrl: string;
  image: any;
}

export const MODEL_STORIES: Record<string, ModelStoryContent> = {
  '1': {
    id: '1',
    title: 'Quân Pháp đổ bộ Sơn Trà',
    subtitle: 'Mở đầu cuộc xâm lược 1858',
    year: '1858',
    description:
      'Ngày 1/9/1858, liên quân Pháp – Tây Ban Nha nổ súng tấn công Đà Nẵng và đổ bộ lên bán đảo Sơn Trà, mở đầu cuộc chiến tranh xâm lược Việt Nam kéo dài gần một thế kỷ.',
    meaning:
      'Khởi đầu thời kỳ chống thực dân Pháp, khơi dậy ý chí kháng chiến kiên cường và phong trào giữ nước của nhân dân Việt Nam.',
    keyMoments: [
      'Liên quân Pháp – Tây Ban Nha bắn phá thành Đà Nẵng',
      'Sơn Trà trở thành bàn đạp chiến lược cho quân xâm lược',
      'Triều đình Huế phát động những cuộc phản công đầu tiên',
      'Nhân dân miền Trung dựng lũy, cầm vũ khí chống giặc',
    ],
    videoUrl: 'https://www.youtube.com/watch?v=g1Tdx37G3uA',
    image: require('../assets/image/thuyenphap.jpg'),
  },
  '2': {
    id: '2',
    title: 'Tuyên ngôn Độc lập',
    subtitle: 'Bác Hồ đọc tại Ba Đình',
    year: '1945',
    description:
      'Ngày 2/9/1945 tại Quảng trường Ba Đình, Chủ tịch Hồ Chí Minh đọc Tuyên ngôn Độc lập, chấm dứt chế độ thực dân – phong kiến và khai sinh nước Việt Nam Dân chủ Cộng hòa.',
    meaning:
      'Khẳng định quyền độc lập, tự do của dân tộc Việt Nam và mở ra kỷ nguyên xây dựng đất nước theo con đường tự chủ, thống nhất.',
    keyMoments: [
      'Thắng lợi của Cách mạng Tháng Tám 1945',
      'Hàng chục vạn đồng bào dự lễ tại Quảng trường Ba Đình',
      'Bản Tuyên ngôn vang lên khẳng định quyền sống của dân tộc',
      'Nước Việt Nam Dân chủ Cộng hòa chính thức ra đời',
    ],
    videoUrl: 'https://www.youtube.com/watch?v=pZk6Xys64Ik',
    image: require('../assets/image/buc.jpg'),
  },
  '3': {
    id: '3',
    title: 'Chiến thắng Điện Biên Phủ',
    subtitle: 'Lừng lẫy năm châu, chấn động địa cầu',
    year: '1954',
    description:
      'Từ tháng 3 đến tháng 5/1954, quân đội Việt Nam tiến hành chiến dịch Điện Biên Phủ, đánh bại tập đoàn cứ điểm mạnh nhất của Pháp và giành chiến thắng vào ngày 7/5/1954.',
    meaning:
      'Buộc Pháp ký Hiệp định Genève, chấm dứt chiến tranh xâm lược Việt Nam và khẳng định sức mạnh đoàn kết, ý chí chiến đấu bất khuất của dân tộc.',
    keyMoments: [
      'Kéo pháo vào – kéo pháo ra chuẩn bị cho chiến dịch',
      'Tấn công các cứ điểm Him Lam, Độc Lập, Bản Kéo',
      'Chiếm hầm chỉ huy tướng De Castries trưa 7/5/1954',
      'Hiệp định Genève được ký kết, chấm dứt chiến tranh ở Việt Nam',
    ],
    videoUrl: 'https://www.youtube.com/watch?v=QdHJkdbzTI0',
    image: require('../assets/image/xetang.jpg'),
  },
  '4': {
    id: '4',
    title: 'Ngô Môn - Cổng Hoàng Cung Huế',
    subtitle: 'Biểu tượng kiến trúc triều Nguyễn',
    year: '1833',
    description:
      'Ngọ Môn là cổng chính vào Hoàng thành Huế, được xây dựng năm 1833 dưới thời vua Minh Mạng. Đây là nơi diễn ra các nghi lễ trọng đại của triều đình nhà Nguyễn.',
    meaning:
      'Kiệt tác kiến trúc cung đình Việt Nam, thể hiện quyền uy hoàng gia và nghệ thuật xây dựng tài hoa của người Việt thế kỷ XIX.',
    keyMoments: [
      'Hoàn thành xây dựng năm 1833 dưới triều Minh Mạng',
      'Nơi công bố chiếu chỉ và diễn ra các nghi lễ trọng đại',
      'Kiến trúc kết hợp phong cách Việt - Hoa độc đáo',
      'Di sản văn hóa thế giới được UNESCO công nhận',
    ],
    videoUrl: 'https://www.youtube.com/watch?v=example',
    image: require('../assets/image/ngomon.jpg'),
  },
};

export const MODEL_STORY_LIST = Object.values(MODEL_STORIES);

