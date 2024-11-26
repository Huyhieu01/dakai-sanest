import React, { FC, useEffect, useState } from "react";
import { atom, useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { getAccessToken, getPhoneNumber } from "zmp-sdk/apis";
import { chiTietDiaChi, requestPhoneTriesState, userState } from "state";
import { ListItem } from "components/list-item";

export const phoneNumberAtom = atom<string | null>({
  key: "phoneNumberAtom",
  default: null,
});

export const PhonePicker: FC = () => {
  const user = useRecoilValue(userState);
  const [phoneNumber, setPhoneNumber] = useRecoilState(phoneNumberAtom);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("Chưa có số");
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const handleChoosePerson = async () => {
    setIsLoading(true);
    setStatus("loading");

    try {
      const accessToken = await getAccessToken({});
      const { token } = await getPhoneNumber({});

      const timeoutPromise = new Promise((_, reject) => {
        setTimeoutId(
          setTimeout(() => {
            reject(new Error("Webhook request timed out"));
          }, 10000) // 10 giây
        );
      });
      const data = {
        accessToken: accessToken,
        token: token,
        type: "phone-user",
      };

      const fetchPromise = fetch(
        "https://pro.n8n.vn/webhook/miniapp-lark-dakai", 
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      const response = await Promise.race([fetchPromise, timeoutPromise]);
      clearTimeout(timeoutId!);
      setTimeoutId(null);

      // Kiểm tra kiểu dữ liệu của response
      if (response instanceof Response) {
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Lỗi không xác định từ webhook");
        }

        const data = await response.json();
        if (data && data.phone) {
          setPhoneNumber(data.phone);
        } else {
          console.error("Không tìm thấy số điện thoại trong phản hồi:", data);
          setErrorMessage("Không tìm thấy số điện thoại");
          setStatus("error");
        }
      } else if (response instanceof Error) {
        // Xử lý lỗi timeout
        console.error("Webhook request timed out:", response);
        setErrorMessage("Quá thời gian chờ phản hồi từ hệ thống, vui lòng thử lại"); // Thông báo rõ ràng hơn
        setStatus("error");
      }
    } catch (error) {
      console.error("Lỗi khi chọn người nhận:", error);
      setErrorMessage("Có lỗi xảy ra, vui lòng thử lại sau"); // Thông báo chung chung hơn
      setStatus("error");
    } finally {
      setIsLoading(false);
      setStatus("idle");
    }
  };

  useEffect(() => {
    const newTitle = (() => {
      switch (status) {
        case "loading":
          return "Đang lấy số điện thoại...";
        case "error":
          return errorMessage || "Lỗi khi lấy số điện thoại";
        // Trường hợp timeout
        case "idle":
          if (errorMessage === "Webhook request timed out") {
            return "Không thể lấy số điện thoại do quá thời gian chờ";
          }
          // Trường hợp bình thường
          return user ? `${user.name} - ${phoneNumber || "Chưa có số"}` : "Chưa có số";
      }
    })();

    if (newTitle !== title) {
      setTitle(newTitle);
    }
  }, [status, errorMessage, user, phoneNumber]);

  const subtitle = status === "error" ? "Vui lòng thử lại" : "Yêu cầu truy cập số điện thoại";

  return (
    <ListItem
      title={title}
      subtitle={subtitle}
      isLoading={status === "loading"}
      onClick={status === "idle" ? handleChoosePerson : undefined}
    />
  );
};

export const RequestPersonPickerPhone: FC = () => {
  const retry = useSetRecoilState(requestPhoneTriesState);
  return (
    <ListItem
      onClick={() => retry((r) => r + 1)}
      title="Chọn người nhận" subtitle="Yêu cầu truy cập số điện thoại"
    />
  );
};

