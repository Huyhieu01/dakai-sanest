import { DisplayPrice } from "components/display/price";
import React, { FC, useState } from "react";
import { useRecoilValue } from "recoil";
import {
  totalPriceState,
  totalQuantityState,
  chiTietDiaChi,
  orderNoteState,
  validDeliveryInfoState,
  cartState,
  userState,
} from "state";
import { Box, Button, Text, Modal } from "zmp-ui";
import { phoneCard } from "./card-picker";
import { selectedTableState } from "./cart-items";
import { phoneNumberAtom } from "./phone-picker";
import { locationAtom } from "./location-picker";
import {  selecteTimeDate } from "./time-picker"
import pay from "utils/product";

// Định nghĩa kiểu dữ liệu cho OrderData  
interface OrderData {  
  method: string;  
  table?: string;  
  memberPhoneNumber?: string;  
  items: any; // Thay đổi 'any' về kiểu dữ liệu thực tế của items  
  totalPrice: number;  
  phone?: string | null;  
  location?: string | null;  
  addlocation?: string;  
  time?: string | null;  
  note?: string;  
  user?: string;  
  type?: string;  
}  

export const CartPreview: FC = () => {
  const user = useRecoilValue(userState);
  const quantity = useRecoilValue(totalQuantityState);
  const totalPrice = useRecoilValue(totalPriceState);

  const selectedTable = useRecoilValue(selectedTableState);
  const memberPhoneNumber = useRecoilValue(phoneCard);
  const note = useRecoilValue(orderNoteState);
  const time = useRecoilValue(selecteTimeDate);
  const location = useRecoilValue(locationAtom);
  const phone = useRecoilValue(phoneNumberAtom);
  const addlocation = useRecoilValue(chiTietDiaChi);
  const cart = useRecoilValue(cartState);

  // State cho các modal
  const [modalWaitCheckLocation, setModalWaitCheckLocation] = useState(false);
  const [modalDone, setModalDone] = useState(false);
  const [modalFailed, setModalFailed] = useState(false);

  const handleOrderSubmit = async () => {
    // Hiện modal kiểm tra vị trí
    setModalWaitCheckLocation(true);

    // Kiểm tra vị trí và gửi đơn hàng
    const isLocationValid = validDeliveryInfoState;

    if (isLocationValid) {
      let orderData: OrderData;

      // Xác định phương thức thanh toán và xây dựng orderData
      if (selectedTable && memberPhoneNumber) {
        orderData = {
          method: "table",
          table: selectedTable,
          memberPhoneNumber,
          items: cart, // Sản phẩm trong giỏ hàng
          totalPrice,
          "type":"member"
        };
      } else if (selectedTable) {
        orderData = {
          method: "table",
          table: selectedTable,
          items: cart, // Sản phẩm trong giỏ hàng
          totalPrice,
          "type":"no-member"
        };
      } else {
        orderData = {
          method: "delivery",
          phone: phone,
          location: location,
          addlocation,
          time: time,
          note,
          items: cart, // Sản phẩm trong giỏ hàng
          totalPrice,
          user: user.name,
          "type":"ship"
        };
      }

      // Gửi thông tin đơn hàng đến webhook
      try {
        const response = await fetch("https://pro.n8n.vn/webhook/miniapp-lark-dakai-order", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(orderData),
        });

        const result = await response.json();

        // Đóng modal kiểm tra vị trí
        setModalWaitCheckLocation(false);

        if (result.status === "done") {  
          setModalDone(true);  
          // Kiểm tra phương thức thanh toán  
          if (orderData.method === "delivery") {  
            setTimeout(() => {  
              setModalDone(false); // Đóng modal thành công sau 2 giây  
              pay(totalPrice); // Gọi hàm pay sau có modal  
            }, 2000);  
          }  
        } else {  
          setModalFailed(true);  
        }  
      } catch (error) {
        console.error("Error:", error);
        setModalFailed(true);
        setModalWaitCheckLocation(false);
      }
    } else {
      setModalWaitCheckLocation(false);
      setModalFailed(true);
    }
  };

  return (
    <Box flex className="sticky bottom-0 bg-background p-4 space-x-4">
      <Box
        flex
        flexDirection="column"
        justifyContent="space-between"
        className="min-w-[120px] flex-none"
      >
        <Text className="text-gray" size="xSmall">
          {quantity} sản phẩm
        </Text>
        <Text.Title size="large">
          <DisplayPrice>{totalPrice}</DisplayPrice>
        </Text.Title>
      </Box>
      <Button
        type="highlight"
        disabled={!quantity}
        fullWidth
        onClick={handleOrderSubmit}
      >
        Đặt hàng
      </Button>

      {/* Chỉ render modal khi cần */}
      {modalWaitCheckLocation && (
        <Modal
          visible={modalWaitCheckLocation}
          title="Đang gửi đơn hàng......"
          zIndex={1100}
          className="p-4"
          actions={[
            {
              text: "Đóng",
              close: false, // Không cho phép đóng modal này
            },
          ]}
          coverSrc="https://res.cloudinary.com/dqcrcdufy/image/upload/v1729843519/Th%C3%AAm_ti%C3%AAu_%C4%91%E1%BB%81_5_bikgwc.png"
        >
        </Modal>
      )}

      {modalDone && (
        <Modal
          visible={modalDone}
          title="Đặt hàng thành công!"
          zIndex={1101}
          className="p-4"
          onClose={() => {
            setModalDone(false);
          }}
          actions={[
            {
              text: "OK",
              highLight: true,
              close: true
            },
          ]}
          coverSrc="https://res.cloudinary.com/dqcrcdufy/image/upload/v1729916935/DAKAI%20Cafe/uexb8b7yskvrxwjljvbi.png"
        >
        </Modal>
      )}

      {modalFailed && (
        <Modal
          visible={modalFailed}
          title="Đặt hàng không thành công!"
          zIndex={1102}
          className="p-4"
          onClose={() => setModalFailed(false)}
          actions={[
            {
              text: "OK",
              highLight:true,
              close: true
            },
          ]}
        >
          <Text>Xin lỗi, đã xảy ra lỗi trong quá trình đặt hàng. Vui lòng thử lại.</Text>
        </Modal>
      )}
    </Box>
  );
};
