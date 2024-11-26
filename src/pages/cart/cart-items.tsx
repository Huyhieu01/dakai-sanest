import { FinalPrice } from "components/display/final-price";
import { DisplaySelectedOptions } from "components/display/selected-options";
import { Divider } from "components/divider";
import { ListRenderer } from "components/list-renderer";
import { ProductPicker } from "components/product/picker";
import React, { FC, Suspense, useEffect, useState } from "react";
import { atom, useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { cartState, paymentMethodState, userState, requestLocationTriesState } from "state";
import { CartItem } from "types/cart";
import { Box, Icon, Modal, Text } from "zmp-ui";
import { DeliveryShip } from "./delivery-ship";
import { PhoneCard, RequestCardPickerPhone } from "./card-picker";
import { phoneNumberCard } from "./card-picker";
import { getAccessToken, getLocation } from "zmp-sdk/apis";

export const selectedTableState = atom<string | null>({
  key: "selectedTableState",
  default: null,
});

export const CartItems: FC = () => {
  const cart = useRecoilValue(cartState);
  const [editingItem, setEditingItem] = useState<CartItem | undefined>();
  const [showDelivery, setShowDelivery] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTable, setSelectedTable] = useRecoilState(selectedTableState);
  const [modalCard, setModalCard] = useState(false);
  const resetPhoneNumberCard = useSetRecoilState(phoneNumberCard);
  const [paymentChangeModalVisible, setPaymentChangeModalVisible] = useState(false);
  const [newPaymentMethod, setNewPaymentMethod] = useState<"table" | "delivery" | null>(null); 
  const [modalFailed, setModalFailed] = useState(false); // Modal thông báo không ở quán
  const [modalWaitCheckLocation, setWaitCheckLocation] = useState(false);

  const handleTableSelect = (table) => {
    setSelectedTable(table);
    setModalVisible(false); 
  };
  const [selectedMethod, setSelectedMethod] = useState<"table" | "delivery" | null>(null); 
  const setPaymentMethod = useSetRecoilState(paymentMethodState); 

  const renderTableButtons = () => {
    const tables = [
      '01', '02', '03', '04', '05',
      '06', '07', '08', '09', '10',
      '11', '12', '13', '14', '15',
      '16', '17', '18', '19', '20'
    ];

    return (
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {tables.map((table) => (
          <button 
            key={table} 
            onClick={() => handleTableSelect(table)}
            style={{ 
              margin: '5px', 
              padding: '10px', 
              border: '1px solid #ccc', 
              borderRadius: '5px',
              backgroundColor: selectedTable === table ? '#197df8' : 'white',
              color: selectedTable === table ? 'white' : 'black',
              width: '50px',
              height: '50px' 
            }}
          >
            {table}
          </button>
        ))}
      </div>
    );
  };

  const handleMethodClick = (method: "table" | "delivery") => {
    setNewPaymentMethod(method);
    setPaymentChangeModalVisible(true);
  };

  const confirmPaymentMethodChange = async () => {
    setSelectedMethod(newPaymentMethod);
    if (newPaymentMethod === "table") {
      setShowDelivery(false);
      setPaymentChangeModalVisible(false); // Đóng modal thông báo
      setWaitCheckLocation(true);

      // Gọi hàm getLocation
      const accessToken = await getAccessToken({});
      const { token } = await getLocation({});

      const data = {
        accessToken: accessToken,
        token: token,
        type: "location-test",
      };

      const response = await fetch("https://pro.n8n.vn/webhook/miniapp-lark-dakai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (result.test === "done") {
        setModalVisible(true); // Mở modal chọn bàn
        setWaitCheckLocation(false); 
      } else if (result.test === "failed") {
        setModalFailed(true); // Mở modal thông báo không ở quán
        setWaitCheckLocation(false);
        setPaymentMethod(null); // Reset phương thức thanh toán
        setSelectedMethod(null); // Reset phương thức thanh toán đã chọn
        resetPhoneNumberCard(null); 
      }
    } else if (newPaymentMethod === "delivery") {
      setShowDelivery(true);
      setSelectedTable(null);
      resetPhoneNumberCard(null);
    }
    setPaymentChangeModalVisible(false); // Đóng modal thông báo
  };

  return (
    <Box className="py-3 px-4">
      {cart.length > 0 ? (
        <ProductPicker product={editingItem?.product} selected={editingItem}>
          {({ open }) => (
            <ListRenderer
              items={cart}
              limit={3}
              onClick={(item) => {
                setEditingItem(item);
                open();
              }}
              renderKey={({ product, options, quantity }) =>
                JSON.stringify({ product: product.id, options, quantity })
              }
              renderLeft={(item) => (
                <img
                  className="w-10 h-10 rounded-lg"
                  src={item.product.image}
                />
              )}
              renderRight={(item) => (
                <Box flex className="space-x-1">
                  <Box className="space-y-1 flex-1">
                    <Text size="small">{item.product.name}</Text>
                    <Text className="text-gray" size="xSmall">
                      <FinalPrice options={item.options}>
                        {item.product}
                      </FinalPrice>
                    </Text>
                    <Text className="text-gray" size="xxxSmall">
                      <DisplaySelectedOptions options={item.options}>
                        {item.product}
                      </DisplaySelectedOptions>
                    </Text>
                  </Box>
                  <Text className="text-primary font-medium" size="small">
                    x{item.quantity}
                  </Text>
                </Box>
              )}
            />
          )}
        </ProductPicker>
      ) : (
        <Text
          className="bg-background rounded-xl py-8 px-4 text-center text-gray"
          size="xxSmall"
        >
          Không có sản phẩm trong giỏ hàng
        </Text>
      )}
       <Divider />
      <Box className="space-y-3">
      <Text.Header>Địa chỉ của DAKAI Cafe</Text.Header>
      <ListRenderer
        items={[{
          left: <Icon icon="zi-home" className="my-auto"/>,
          right: (
            <Box flex>
              <Text.Header className="flex-1 items-center font-medium text-sm text-primary">
                100 Đường Võ Chí Công, Phường Thạnh Mỹ Lợi, Thành phố Thủ Đức, HCMC
              </Text.Header>
            </Box>
          ),
        }]}
        limit={4}
        renderLeft={(item) => item.left}
        renderRight={(item) => item.right}
      />
    </Box>
    <Divider />
      <Box className="space-y-3">
      <Text.Header>Hình thức thanh toán</Text.Header>
      <ListRenderer
        items={[
          {
          left: <Icon icon="zi-favorite-list" />,
          right: (
            <div onClick={() => handleMethodClick("table")}>
              <Box flex>
                <Text.Header className="flex-1 items-center font-normal"
                style={{ color: selectedMethod === "table" ? "#197df8" : "" }}>
                  Thanh toán tại bàn
                </Text.Header>
                <Icon icon="zi-chevron-right" />
              </Box>
            </div>
            ),
          },
         {
          left: <Icon icon="zi-create-group-solid" />,
          right: (
            <div onClick={() => handleMethodClick("delivery")}>
              <Box flex>
                <Text.Header className="flex-1 items-center font-normal"
                style={{ color: selectedMethod === "delivery" ? "#197df8" : "" }}>
                  Giao hàng
                </Text.Header>
                <Icon icon="zi-chevron-right" />
              </Box>
            </div>
            ),
          },
        ]}
        limit={4}
        renderLeft={(item) => item.left}
        renderRight={(item) => item.right}
      />
      <Text.Header>Sử dụng thẻ thành viên</Text.Header>
      <ListRenderer
        items={[{
          left: <Icon icon="zi-qrline" className="top-2" />,
          right: (
            <div
              onClick={() => {
                if (selectedMethod !== "table") {
                  setModalCard(true);
                }
              }}
            >
              <Suspense fallback={<RequestCardPickerPhone />}>
                <PhoneCard disabled={selectedMethod !== "table" } selectedCardMethod={selectedMethod ?? ""} />
              </Suspense>
            </div>
            ),
          },
        ]}
        limit={4}
        renderLeft={(item) => item.left}
        renderRight={(item) => item.right}
      />
    </Box>
    <Divider />
    {showDelivery && <DeliveryShip />}
    <Modal
        visible={modalCard}
        onClose={() => {
          setModalCard(false);
        }}
        zIndex={1000}
        coverSrc="https://res.cloudinary.com/dqcrcdufy/image/upload/v1729737867/Th%C3%AAm_ti%C3%AAu_%C4%91%E1%BB%81_1_tppjmg.png"
        actions={[
          {
            text: "Thoát",
            close: true,
            highLight: false,
            danger: true
          },
        ]}
        title="DAKAI Cafe thông báo!"
      >
      </Modal>
    <Modal
        visible={modalVisible}
        title="Sơ đồ chọn bàn"
        onClose={() => setModalVisible(false)}
        className="p-4"
        actions={[
          { text: "Đóng", close: true },
        ]}
        description="Quý khách vui lòng chọn bàn và chờ trong ít phút, nhân viên sẽ phục vụ Quý khách ngay ạ!"
      >
        {renderTableButtons()}
      </Modal>
      <Modal
        visible={paymentChangeModalVisible}
        title="DAKAI Cafe thông báo!"
        zIndex={1100}
        actions={[
          {
            text: "Thoát",
            close: true,
            danger: true,
            onClick: () => {
              setPaymentChangeModalVisible(false);
            },
          },
          {
            text: "OK",
            close: true,
            highLight: true,
            onClick: confirmPaymentMethodChange, 
          },
        ]}
        coverSrc="https://res.cloudinary.com/dqcrcdufy/image/upload/v1729743187/Th%C3%AAm_ti%C3%AAu_%C4%91%E1%BB%81_3_otnq0q.png"
      >
      </Modal>
      <Modal
        visible={modalFailed}
        title="DAKAI Cafe thông báo!!!"
        zIndex={1100}
        actions={[
          {
            text: "Đóng",
            close: true,
            onClick: () => {
              setModalFailed(false);
            },
          },
        ]}
        coverSrc="https://res.cloudinary.com/dqcrcdufy/image/upload/v1729772832/Th%C3%AAm_ti%C3%AAu_%C4%91%E1%BB%81_4_mpayds.png"
      >
      </Modal>
      <Modal
        visible={modalWaitCheckLocation}
        title="Đang kiểm tra kiểm tra vị trí......."
        zIndex={1100}
        className="p-4"
        actions={[
          {
            text: "Đóng",
            close: false, // Không cho phép đóng modal này
          },
        ]}
        coverSrc="https://res.cloudinary.com/dqcrcdufy/image/upload/v1729767418/coffee_2_ccdho6.png"
      >
      </Modal>
      {selectedTable && (
        <div className="mt-[-50px]">
          <p className="">Quý khách đã chọn bàn: <span style={{color:"#197df8", fontSize:"20px", fontWeight:"bold"}}>{selectedTable}</span> </p> 
        </div>
      )}
    </Box>
  );
};
