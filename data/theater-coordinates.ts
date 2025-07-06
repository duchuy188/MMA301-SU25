export const THEATER_COORDINATES: Record<string, { latitude: number, longitude: number, imageUrl: string }> = {
  // Galaxy Cinema Nguyễn Văn Quá
  "119B Nguyễn Văn Quá, Phường Đông Hưng Thuận, Quận 12": { 
    latitude: 10.865432, 
    longitude: 106.628712,
    imageUrl: "https://th.bing.com/th/id/R.d76bc5660b8b15bdb6e2567cc0b5a9db?rik=1mmjZ2TjdYdjcg&pid=ImgRaw&r=0"
  },
  
  // Galaxy Cinema Trường Chinh
  "Tầng 3 - CoopMart TTTM Thắng Lợi - Số 2 Trường Chinh, Tây Thạnh, Tân Phú": { 
    latitude: 10.790312, 
    longitude: 106.637823,
    imageUrl: "https://www.galaxycine.vn/media/2022/11/14/baivietwebsite-01_1668399336367.jpg"
  },
  
  // Galaxy Cinema Huỳnh Tấn Phát
  "Lầu 2, TTTM Coopmart, số 1362 Huỳnh Tấn Phát, khu phố 1, Phường Phú Mỹ, Quận 7": { 
    latitude: 10.710523, 
    longitude: 106.731245,
    imageUrl: "https://thangtien.vn/public/uploads/images/projects/GALAXY%20HUYNHTANPHAT.jpg"
  },
  
  // Galaxy Cinema Trung Chánh
  "TTVH Quận 12, Số 09 Quốc Lộ 22, P. Trung Mỹ Tây, Quận 12": { 
    latitude: 10.848765, 
    longitude: 106.612387,
    imageUrl: "https://kenhhomestay.com/wp-content/uploads/2019/10/galaxy-trung-chanh-1.jpg"
  },
  
  // Galaxy Nguyễn Du
  "116 Nguyễn Du, Quận 1, TP.HCM": { 
    latitude: 10.773456, 
    longitude: 106.693218,
    imageUrl: "https://th.bing.com/th/id/R.c7e9bdd38e401c0a8e0228c50bfaa834?rik=EZ3YGkj%2fahdAyQ&pid=ImgRaw&r=0"
  },
  
  // Galaxy Cinema - Thiso Mall
  "Tầng 3, Thiso Mall Sala, 10 Mai Chí Thọ, Phường Thủ Thiêm, Thành phố Thủ Đức": { 
    latitude: 10.772683, 
    longitude: 106.721361,
    imageUrl: "https://thisomallsala.vn:441/Resource/Images/Outlet/GALAXYCINEMA/Detail/Detail_1200_600.webp"
  }
};

// Hàm tìm tọa độ dựa trên địa chỉ
export const getCoordinatesByAddress = (address: string) => {
  // Tìm địa chỉ chính xác
  if (THEATER_COORDINATES[address]) {
    return THEATER_COORDINATES[address];
  }
  
  // Tìm địa chỉ gần đúng (chứa một phần)
  for (const [addr, data] of Object.entries(THEATER_COORDINATES)) {
    // So sánh một phần địa chỉ
    if (address.includes(addr) || addr.includes(address)) {
      return data;
    }
  }
  
  // Mặc định trả về trung tâm TPHCM và ảnh mặc định
  return { 
    latitude: 10.7769, 
    longitude: 106.7009,
    imageUrl: "https://www.galaxycine.vn/media/2019/5/6/galaxy-cinema-1_1557134835292.jpg"
  };
};

// Hàm tìm tọa độ dựa trên tên rạp
export const getCoordinatesByName = (theaterName: string) => {
  const nameToAddress: Record<string, string> = {
    "Galaxy Cinema Nguyễn Văn Quá": "119B Nguyễn Văn Quá, Phường Đông Hưng Thuận, Quận 12",
    "Galaxy Cinema Trường Chinh": "Tầng 3 - CoopMart TTTM Thắng Lợi - Số 2 Trường Chinh, Tây Thạnh, Tân Phú",
    "Galaxy Cinema Huỳnh Tấn Phát": "Lầu 2, TTTM Coopmart, số 1362 Huỳnh Tấn Phát, khu phố 1, Phường Phú Mỹ, Quận 7",
    "Galaxy Cinema Trung Chánh": "TTVH Quận 12, Số 09 Quốc Lộ 22, P. Trung Mỹ Tây, Quận 12",
    "Galaxy Nguyễn Du": "116 Nguyễn Du, Quận 1, TP.HCM",
    "Galaxy Cinema - Thiso Mall": "Tầng 3, Thiso Mall Sala, 10 Mai Chí Thọ, Phường Thủ Thiêm, Thành phố Thủ Đức"
  };
  
  const address = nameToAddress[theaterName];
  if (address) {
    return THEATER_COORDINATES[address];
  }
  
  // Tìm tên gần đúng
  for (const [name, addr] of Object.entries(nameToAddress)) {
    if (theaterName.includes(name) || name.includes(theaterName)) {
      return THEATER_COORDINATES[addr];
    }
  }
  
  // Mặc định trả về trung tâm TPHCM
  return { latitude: 10.7769, longitude: 106.7009 };
};
