import React, { FC, useEffect, useState } from "react";
import { atom, useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { getAccessToken, getPhoneNumber } from "zmp-sdk/apis";
import { chiTietDiaChi, requestPhoneTriesState, userState } from "state";
import { ListItem } from "components/list-item";
import { TheThanhVien } from "components/theThanhVien";

export const phoneNumberCard = atom<string | null>({
  key: "phoneNumberCard",
  default: null,
});

export const phoneCard = atom<string | null>({
  key: "phoneCard",
  default: null,
});

export const PhoneCard: FC <{ disabled?: boolean; selectedCardMethod: string }> = ({ disabled = false, selectedCardMethod, }) => {
  const user = useRecoilValue(userState);
  const [phoneNumber, setPhoneNumber] = useRecoilState(phoneNumberCard);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("Chưa có số");
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [cardLimit, setCardLimit] = useState<string | null>(null);
  const [cardPhone, setCardPhone] = useRecoilState(phoneCard);
   
  useEffect(() => {
    if (selectedCardMethod !== "table") {
      // Khi phương thức không phải là chọn bàn, reset trạng thái
      setPhoneNumber(null);
      setCardLimit(null);
      setTitle("Chưa có số");
      setStatus("idle");
      setErrorMessage(null);
      setCardPhone(null);
    }
  }, [selectedCardMethod]); 
  const handleChoosePerson = async () => {
    if (disabled) {
      // Nếu chức năng bị vô hiệu hóa thì không làm gì cả
      return;
    }
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
        type: "phone-card",
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
        if (data && data.text) {
          setPhoneNumber(data.text);
        } else {
          console.error("Không tìm thấy số điện thoại trong phản hồi:", data);
          setErrorMessage("Không tìm thấy số điện thoại");
          setStatus("error");
        }
        if (data && data["limit-fix"]) {
          setCardLimit(data["limit-fix"]); // Cập nhật hạn mức vào state
        }
        if (data && data["phone"]) {
          setCardPhone(data["phone"]); // Cập nhật hạn mức vào state
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
          return "Đang kiểm tra số điện thoại...";
        case "error":
          return errorMessage || "Lỗi khi lấy số điện thoại";
        // Trường hợp timeout
        case "idle":
          if (errorMessage === "Webhook request timed out") {
            return "Không thể kiểm tra do quá thời gian chờ";
          }
          // Trường hợp bình thường
          return user ? `${phoneNumber || "Kiểm tra thẻ thành viên"} - ${cardPhone || "Số điện thoại"}` : "Kiểm tra thẻ thành viên";
      }
    }
    )();

    if (newTitle !== title) {
      setTitle(newTitle);
    }
  }, [status, errorMessage, user, phoneNumber, cardPhone]);

  const subtitle =
  cardLimit && status === "idle"
    ? "Nhấn lần nữa để kiểm tra số dư còn lại sau đặt hàng nhé! (Thực hiện sau 5 phút)"
    : "Yêu cầu kiểm tra số điện thoại";

  return (
    <div>
    <TheThanhVien
      title={title}
      subtitle={subtitle}
      isLoading={status === "loading"}
      onClick={disabled || status !== "idle" ? undefined : handleChoosePerson}
    />
    {cardLimit && (
      <div style={{marginTop: "10px"}}>
        <p><span style={{marginTop: "10px", fontSize: "16px", fontWeight: "bold"}}>Hạn mức còn lại:</span> <span style={{marginTop: "10px", color: "#197df8", fontSize: "16px", fontWeight: "bold"}}>{cardLimit} đ</span></p>
      </div>
    )}
    </div>
  );
};

export const RequestCardPickerPhone: FC<any> = ({ onClick }) => {
  return (
    <TheThanhVien
      onClick={onClick}
      title="Thẻ thành viên" subtitle="Yêu cầu truy cập số điện thoại"
    />
  );
};

