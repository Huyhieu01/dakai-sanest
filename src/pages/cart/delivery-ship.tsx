import { ElasticTextarea } from "components/elastic-textarea";
import { ListRenderer } from "components/list-renderer";
import React, { FC, Suspense, useEffect } from "react";
import { Box, Icon, Text } from "zmp-ui";
import { PhonePicker, RequestPersonPickerPhone } from "./phone-picker";
import { RequestStorePickerLocation, StorePicker } from "./location-picker";
import { TimePicker } from "./time-picker";
import { useRecoilState, useRecoilValue } from "recoil";
import {
  chiTietDiaChi,
  orderNoteState,
  requestPhoneTriesState,
  validDeliveryInfoState,
} from "state";

import { selecteTimeDate } from "./time-picker"



export const DeliveryShip: FC = () => {
  const [note, setNote] = useRecoilState(orderNoteState);
  const [phoneNumber, setPhoneNumber] = useRecoilState(requestPhoneTriesState);
  const [addlocation, setAddLocation] = useRecoilState(chiTietDiaChi);
  const [validDeliveryInfo, setValidDeliveryInfo] = useRecoilState(validDeliveryInfoState);

  const isPhoneValid = !!phoneNumber;
  const isLocationValid = !!addlocation;
  const isTimeValid = !!selecteTimeDate;

  useEffect(() => {
    setValidDeliveryInfo(isPhoneValid && isLocationValid && isTimeValid);
  }, [isPhoneValid, isLocationValid, isTimeValid]);

  // Hàm để lấy thông tin giao hàng
  const getDeliveryInfo = () => ({
    phoneNumber,
    location: addlocation,
    deliveryTime: selecteTimeDate,
    note,
  });

  return (
    <Box className="space-y-3 px-4">
      <Text.Header>Hình thức nhận hàng</Text.Header>
      <ListRenderer
        items={[
          {
            left: <Icon icon="zi-user" className="my-auto" />,
            right: (
              <Suspense fallback={<RequestPersonPickerPhone />}>
                <PhonePicker />
              </Suspense>
            ),
          },
          {
            left: <Icon icon="zi-location" className="my-auto" />,
            right: (
              <Suspense fallback={<RequestStorePickerLocation />}>
                <StorePicker />
              </Suspense>
            ),
          },
          {
            left: <Icon icon="zi-post" className="my-auto" />,
            right: (
              <Box>
                <ElasticTextarea
                  placeholder="Chi tiết địa chỉ..."
                  className="border-none px-0 w-full focus:outline-none"
                  maxRows={4}
                  value={addlocation}
                  onChange={(e) => setAddLocation(e.currentTarget.value)}
                />
              </Box>
            ),
          },
          {
            left: <Icon icon="zi-clock-1" className="my-auto" />,
            right: (
              <Box flex className="space-x-2">
                <Box className="flex-1 space-y-[2px]">
                  <TimePicker />
                  <Text size="xSmall" className="text-gray">
                    Thời gian nhận hàng
                  </Text>
                </Box>
                <Icon icon="zi-chevron-right" />
              </Box>
            ),
          },
          {
            left: <Icon icon="zi-note" className="my-auto" />,
            right: (
              <Box flex>
                <ElasticTextarea
                  placeholder="Nhập ghi chú..."
                  className="border-none px-0 w-full focus:outline-none"
                  maxRows={4}
                  value={note}
                  onChange={(e) => setNote(e.currentTarget.value)}
                />
              </Box>
            ),
          },
        ]}
        limit={4}
        renderLeft={(item) => item.left}
        renderRight={(item) => item.right}
      />
    </Box>
  );
};
