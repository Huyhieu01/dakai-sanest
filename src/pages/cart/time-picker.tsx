import React, { FC, useMemo, useState } from "react";  
import { atom, useRecoilState } from "recoil";  
import { displayDate, displayHalfAnHourTimeRange } from "utils/date";  
import { matchStatusBarColor } from "utils/device";  
import { Picker } from "zmp-ui";  

// Định nghĩa atom 'selecteTimeDate' với kiểu dữ liệu string  
export const selecteTimeDate = atom<string | null>({  
  key: "selecteTimeDate",  
  default: "",  
});  

export const selectedDeliveryTimeState = atom<number>({  
  key: "selectedDeliveryTime",  
  default: +new Date(),  
});  

export const TimePicker: FC = () => {  
  const [date, setDate] = useState<number>(+new Date());  
  const [time, setTime] = useRecoilState(selectedDeliveryTimeState);  
  const [timeDate, setTimeDate] = useRecoilState(selecteTimeDate);  

  const availableDates = useMemo(() => {  
    const days: Date[] = [];  
    const today = new Date();  
    for (let i = 0; i < 5; i++) {  
      const nextDay = new Date(today);  
      nextDay.setDate(today.getDate() + i);  
      days.push(nextDay);  
    }  
    return days;  
  }, []);  

  const availableTimes = useMemo(() => {  
    const times: Date[] = [];  
    const now = new Date();  
    let time = new Date();  
    if (now.getDate() === new Date(date).getDate()) {  
      const minutes = Math.ceil(now.getMinutes() / 30) * 30;  
      time.setHours(now.getHours());  
      time.setMinutes(minutes);  
    } else {  
      time.setHours(7);  
      time.setMinutes(0);  
    }  
    time.setSeconds(0);  
    time.setMilliseconds(0);  
    const endTime = new Date();  
    endTime.setHours(21);  
    endTime.setMinutes(0);  
    endTime.setSeconds(0);  
    endTime.setMilliseconds(0);  
    while (time <= endTime) {  
      times.push(new Date(time));  
      time.setMinutes(time.getMinutes() + 30);  
    }  
    return times;  
  }, [date]);  

  const handleChange = (value: { date?: any; time?: any }) => {  
    console.log("handleChange called with:", value);
    const { date, time } = value;  
    if (date) {  
      setDate(+date.value);  
    }  
    if (time) {  
      setTime(+time.value);  
    }  

    if (date && time) {  
      const selectedDate = new Date(date.value);  
      const selectedTime = new Date(time.value);  
      const formattedTimeRange = displayHalfAnHourTimeRange(selectedTime);  
      const formattedDate = displayDate(selectedDate, true);  
      setTimeDate(`${formattedTimeRange}, ${formattedDate}`); // Đặt chuỗi đã định dạng  
    }  
  };  

  return (  
    <Picker  
      mask  
      maskClosable  
      onVisibilityChange={(visible) => matchStatusBarColor(visible)}  
      inputClass="border-none bg-transparent text-sm text-primary font-medium text-md m-0 p-0 h-auto"  
      placeholder="Chọn thời gian nhận hàng"  
      title="Thời gian nhận hàng"  
      value={{  
        date,  
        time: availableTimes.find((t) => +t === time) ? time : +availableTimes[0],  
      }}  
      formatPickedValueDisplay={({ date, time }) =>  
        date && time  
          ? `${displayHalfAnHourTimeRange(new Date(time.value))}, ${displayDate(new Date(date.value))}`  
          : `Chọn thời gian`  
      }  
      onChange={handleChange}  
      data={[  
        {  
          options: availableTimes.map((timeOption) => ({  
            displayName: displayHalfAnHourTimeRange(timeOption),  
            value: +timeOption,  
          })),  
          name: "time",  
        },  
        {  
          options: availableDates.map((dateOption) => ({  
            displayName: displayDate(dateOption, true),  
            value: +dateOption,  
          })),  
          name: "date",  
        },  
      ]}  
    />  
  );  
};