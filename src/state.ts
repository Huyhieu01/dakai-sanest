import { atom, selector, selectorFamily, useRecoilValue, useSetRecoilState } from "recoil";
import { authorize, getAccessToken, getLocation, getPhoneNumber, getSetting, getUserInfo } from "zmp-sdk";
import logo from "static/logo-dakai-cafe.png";
import { Category } from "types/category";
import { Product, Variant } from "types/product";
import { Cart } from "types/cart";
import { Notification } from "types/notification";
import { calculateDistance } from "utils/location";
import { Store } from "types/delivery";
import { calcFinalPrice } from "utils/product";
import { wait } from "utils/async";
import categories from "../mock/categories.json";
import { useEffect, useState } from "react";

export const authorizedState = selector({
  key: "authorized",
  get: async () => {
    const { authSetting } = await getSetting({});
    if (!authSetting["scope.userInfo"]) {
      await authorize({ scopes: [] });
    }
  },
});

// Khởi tạo atom userState để lưu thông tin người dùng
export const userState = atom({
  key: "user",
  default: {
    id: "",
    avatar: "",
    name: "Bạn mới!",
  },
});

// Hàm lấy thông tin người dùng và cập nhật vào userState
export const updateUserInfo = async (setUserState) => {
  try {
    const { userInfo } = await getUserInfo({ autoRequestPermission: true });
    setUserState((prevState) => ({
      ...prevState,
      ...userInfo,
    }));
  } catch (error) {
    console.error("Không thể lấy thông tin người dùng:", error);
  }
};

// Component để lắng nghe và cập nhật userState khi có thao tác
export function UserInfoUpdater() {
  const setUserState = useSetRecoilState(userState);

  useEffect(() => {
    // Gọi updateUserInfo khi component được gắn vào (hoặc có sự kiện)
    const handleUserInteraction = async () => {
      await updateUserInfo(setUserState);
    };

    // Bạn có thể gọi `handleUserInteraction` từ sự kiện hoặc điều kiện nào đó
    handleUserInteraction();
  }, [setUserState]);

  return null; // Thành phần này chỉ để cập nhật trạng thái và không hiển thị
}

export const categoriesState = selector<Category[]>({
  key: "categories",
  get: () => categories,
});

export const productsState = selector<Product[]>({
  key: "products",
  get: async () => {
    await wait(2000);
    const products = (await import("../mock/products.json")).default;
    const variants = (await import("../mock/variants.json"))
      .default as Variant[];
    return products.map(
      (product) =>
        ({
          ...product,
          variants: variants.filter((variant) =>
            product.variantId.includes(variant.id)
          ),
        } as Product)
    );
  },
});

export const recommendProductsState = selector<Product[]>({
  key: "recommendProducts",
  get: ({ get }) => {
    const products = get(productsState);
    return products.filter((p) => p.sale);
  },
});

export const selectedCategoryIdState = atom({
  key: "selectedCategoryId",
  default: "coffee",
});

export const productsByCategoryState = selectorFamily<Product[], string>({
  key: "productsByCategory",
  get:
    (categoryId) =>
    ({ get }) => {
      const allProducts = get(productsState);
      return allProducts.filter((product) =>
        product.categoryId.includes(categoryId)
      );
    },
});

export const cartState = atom<Cart>({
  key: "cart",
  default: [],
});

export const totalQuantityState = selector({
  key: "totalQuantity",
  get: ({ get }) => {
    const cart = get(cartState);
    return cart.reduce((total, item) => total + item.quantity, 0);
  },
});

export const totalPriceState = selector({
  key: "totalPrice",
  get: ({ get }) => {
    const cart = get(cartState);
    return cart.reduce(
      (total, item) =>
        total + item.quantity * calcFinalPrice(item.product, item.options),
      0
    );
  },
});

export const notificationsState = atom<Notification[]>({
  key: "notifications",
  default: [
    {
      id: 1,
      image: logo,
      title: "Chào bạn mới",
      content:
        "Cảm ơn đã sử dụng ZaUI Coffee, bạn có thể dùng ứng dụng này để tiết kiệm thời gian xây dựng",
    },
    {
      id: 2,
      image: logo,
      title: "Giảm 50% lần đầu mua hàng",
      content: "Nhập WELCOME để được giảm 50% giá trị đơn hàng đầu tiên order",
    },
  ],
});

export const keywordState = atom({
  key: "keyword",
  default: "",
});

export const resultState = selector<Product[]>({
  key: "result",
  get: async ({ get }) => {
    const keyword = get(keywordState);
    if (!keyword.trim()) {
      return [];
    }
    const products = get(productsState);
    await wait(500);
    return products.filter((product) =>
      product.name.trim().toLowerCase().includes(keyword.trim().toLowerCase())
    );
  },
});

export const storesState = atom<Store[]>({
  key: "stores",
  default: [
    {
      id: 1,
      name: "DAKAI Cafe",
      address:
        "Số 100 Đường Võ Chí Công, Phường Thạnh Mỹ Lợi, Thành phố Hồ Chí Minh",
      lat: 10.741639,
      long: 106.714632,
    }
  ],
});

export const nearbyStoresState = selector({
  key: "nearbyStores",
  get: ({ get }) => {
    // Get the current location from the locationState atom
    const location = get(locationState);

    // Get the list of stores from the storesState atom
    const stores = get(storesState);

    // Calculate the distance of each store from the current location
    if (location) {
      const storesWithDistance = stores.map((store) => ({
        ...store,
        distance: calculateDistance(
          location.latitude,
          location.longitude,
          store.lat,
          store.long
        ),
      }));

      // Sort the stores by distance from the current location
      const nearbyStores = storesWithDistance.sort(
        (a, b) => a.distance - b.distance
      );

      return nearbyStores;
    }
    return [];
  },
});

export const selectedStoreIndexState = atom({
  key: "selectedStoreIndex",
  default: 0,
});

export const selectedStoreState = selector({
  key: "selectedStore",
  get: ({ get }) => {
    const index = get(selectedStoreIndexState);
    const stores = get(nearbyStoresState);
    return stores[index];
  },
});

// export const selectedDeliveryTimeState = atom<string>({
//   key: "selectedDeliveryTime",
//   default: new Date().toLocaleString('en-GB', { // Định dạng ngày theo kiểu dd/mm/yyyy
//     day: '2-digit',
//     month: '2-digit',
//     year: 'numeric',
//     hour: '2-digit',
//     minute: '2-digit',
//     hour12: false // 24 giờ
//   }).replace(',', ''), // Loại bỏ dấu phẩy
// });

export const requestLocationTriesState = atom({
  key: "requestLocationTries",
  default: 0,
});

export const requestPhoneTriesState = atom({
  key: "requestPhoneTries",
  default: 0,
});

export const requestUserAccessTokenTriesState = atom({
  key: "requestUserAccessTokenTries",
  default: 0,
});


export const locationState = selector<
  { latitude: string; longitude: string } | false
>({
  key: "location",
  get: async ({ get }) => {
    const requested = get(requestLocationTriesState);
    if (requested) {
      const { latitude, longitude, token } = await getLocation({
        fail: console.warn,
      });
      if (latitude && longitude) {
        return { latitude, longitude };
      }
      if (token) {
        console.warn(
          "Sử dụng token này để truy xuất vị trí chính xác của người dùng",
          token
        );
        console.warn(
          "Chi tiết tham khảo: ",
          "https://mini.zalo.me/blog/thong-bao-thay-doi-luong-truy-xuat-thong-tin-nguoi-dung-tren-zalo-mini-app"
        );
        console.warn("Giả lập vị trí mặc định: VNG Campus");
        return {
          latitude: "10.7287",
          longitude: "106.7317",
        };
      }
    }
    return false;
  },
});


export const orderNoteState = atom({
  key: "orderNote",
  default: "",
});

export const chiTietDiaChi = atom({
  key: "chiTietDiaChi",
  default: "",
})

export const validDeliveryInfoState = atom({
  key: "validDeliveryInfoState",
  default: false, // Ban đầu, thông tin chưa hợp lệ
});

const phoneNumberCard = atom<string | null>({
  key: "phoneNumberState",
  default: null,
});

export const paymentMethodState = atom<"table" | "delivery" | "card" |null>({ // Thay đổi kiểu dữ liệu ở đây
  key: "paymentMethodState",
  default: null, // Giá trị mặc định nên là null vì ban đầu chưa có phương thức nào được chọn
});