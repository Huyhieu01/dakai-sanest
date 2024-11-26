import { ListItem } from "components/list-item";
import React, { FC, useEffect, useState } from "react";
import {
  atom,
  useRecoilState,
  useRecoilValue,
  useSetRecoilState,
} from "recoil";
import {
  requestLocationTriesState,
  userState,
} from "state";
import { getAccessToken, getLocation } from "zmp-sdk/apis";

export const locationAtom = atom<string | null>({
  key: "locationAtom",
  default: null,
});

export const StorePicker: FC = () => {
  const user = useRecoilValue(userState);
  const [location, setLocation] = useRecoilState(locationAtom);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("Chưa có địa chỉ");
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [address, setAddress] = useState<string | null>(null); // Thêm state address

  const handleChooseLocation = async () => {
    setIsLoading(true);
    setStatus("loading");
    try {
      const accessToken = await getAccessToken({});
      const { token } = await getLocation({});

      const timeoutPromise = new Promise((_, reject) => {
        setTimeoutId(
          setTimeout(() => {
            reject(new Error("Timeout"));
          }, 10000)
        );
      });
      const data = {
        accessToken: accessToken,
        token: token,
        type: "location-user",
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

      if (response instanceof Response) {
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Lỗi không xác định từ webhook");
        }

        const data = await response.json();
        // Điều chỉnh điều kiện kiểm tra dữ liệu
        if (data && data.location) {
          setLocation(data.location);
        } else {
          console.error(
            "Không tìm thấy thông tin vị trí trong phản hồi:",
            data
          );
          setErrorMessage("Không tìm thấy thông tin vị trí");
          setStatus("error");
        }
      } else if (response instanceof Error) {
        console.error("Webhook request timed out:", response);
        setErrorMessage(
          "Quá thời gian chờ phản hồi từ hệ thống, vui lòng thử lại"
        );
        setStatus("error");
      }
    } catch (error) {
      console.error("Lỗi khi xác định địa chỉ:", error);
      setErrorMessage("Có lỗi xảy ra, vui lòng thử lại sau");
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
          return "Đang lấy địa chỉ...";
        case "error":
          return errorMessage || "Lỗi khi lấy địa chỉ";
        // Trường hợp timeout
        case "idle":
          if (errorMessage === "Webhook request timed out") {
            return "Không thể lấy địa chỉ do quá thời gian chờ";
          }
          // Trường hợp bình thường
          return user ? `${location || "Chưa có địa chỉ"}` : "Chưa có địa chỉ";
      }
    })();

    if (newTitle !== title) {
      setTitle(newTitle);
    }
  }, [status, errorMessage, user, location]);

  const subtitle = status === "error" ? "Vui lòng thử lại" : "Yêu cầu truy cập vị trí";

  return (
    <ListItem
      title={title}
      subtitle={subtitle}
      isLoading={status === "loading"}
      onClick={status === "idle" ? handleChooseLocation : undefined}
    />
  );
};

export const RequestStorePickerLocation: FC = () => {
  const retry = useSetRecoilState(requestLocationTriesState);
  return (
    <ListItem
      onClick={() => retry((r) => r + 1)}
      title="Chọn vị trí của bạn"
      subtitle="Yêu cầu truy cập vị trí"
    />
  );
};
