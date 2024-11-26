import React, { FC } from "react";  
import { Pagination } from "swiper";  
import { Swiper, SwiperSlide } from "swiper/react";  
import { Box } from "zmp-ui";  

export const Banner: FC = () => {  
  const images = [  
    "https://res.cloudinary.com/dqcrcdufy/image/upload/v1730430808/1_tr18s6.png",  
    "https://res.cloudinary.com/dqcrcdufy/image/upload/v1730430808/2_nk32ja.png", // Thay đổi link ảnh 2  
    "https://res.cloudinary.com/dqcrcdufy/image/upload/v1730430808/3_cdakoq.png"  // Thay đổi link ảnh 3  
  ];  

  return (  
    <Box className="bg-white" pb={4}>  
      <Swiper  
        modules={[Pagination]}  
        pagination={{  
          clickable: true,  
        }}  
        autoplay  
        loop  
        cssMode  
      >  
        {images.map((image, i) => (  
          <SwiperSlide key={i} className="px-4">  
            <Box  
              className="w-full rounded-lg aspect-[2/1] bg-cover bg-center bg-skeleton"  
              style={{ backgroundImage: `url(${image})` }}  
            />  
          </SwiperSlide>  
        ))}  
      </Swiper>  
    </Box>  
  );  
};