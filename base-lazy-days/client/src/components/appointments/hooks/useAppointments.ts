import dayjs from "dayjs";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useQuery, useQueryClient } from "react-query";

import { axiosInstance } from "../../../axiosInstance";
import { queryKeys } from "../../../react-query/constants";
import { useUser } from "../../user/hooks/useUser";
import { AppointmentDateMap } from "../types";
import { getAvailableAppointments } from "../utils";
import { getMonthYearDetails, getNewMonthYear, MonthYear } from "./monthYear";

// for useQuery call
async function getAppointments(
  year: string,
  month: string
): Promise<AppointmentDateMap> {
  const { data } = await axiosInstance.get(`/appointments/${year}/${month}`);
  return data;
}

// types for hook return object
interface UseAppointments {
  appointments: AppointmentDateMap;
  monthYear: MonthYear;
  updateMonthYear: (monthIncrement: number) => void;
  showAll: boolean;
  setShowAll: Dispatch<SetStateAction<boolean>>;
}

// useQuery 및 prefetchQuery 모두에 대한 일반 옵션
const commonOptions = {
  staleTime: 0,
  cacheTime: 1000 * 60 * 5,
};

// 이 Hook의 목적은 다음과 같습니다:

// 1. 사용자가 선택한 현재 달/년도(즉, monthYear)를 추적합니다.
//   1-1. state를 업데이트하는 방법을 제공합니다.
// 2. 해당 monthYear에 대한 예약을 반환합니다.
//   2-1. AppointmentDateMap 형식으로 반환합니다 (일별 예약 배열 색인화).
//   2-2. 인접한 monthYear의 예약을 미리 가져옵니다.
// 3. 필터의 상태 (모든 예약 / 가능한 예약)를 추적합니다.
//   3-1. 현재 monthYear에 적용 가능한 예약만 반환합니다.
export function useAppointments(): UseAppointments {
  /** ****************** START 1: monthYear state *********************** */
  // 현재 날짜의 monthYear(기본 monthYear 상태의 경우)를 가져옵니다
  const currentMonthYear = getMonthYearDetails(dayjs());

  // 현재 월을 추적할 상태사용자가 선택한 연도
  // state value is returned in hook return object
  const [monthYear, setMonthYear] = useState(currentMonthYear);

  // setter는 사용자가 보기에서 월을 변경할 때 monthYear obj 상태를 업데이트합니다,
  // returned in hook return object
  function updateMonthYear(monthIncrement: number): void {
    setMonthYear((prevData) => getNewMonthYear(prevData, monthIncrement));
  }
  /** ****************** END 1: monthYear state ************************* */
  /** ****************** START 2: filter appointments  ****************** */
  // 모두 또는 사용 가능한 항목만 표시하도록 약속 필터링 상태 및 기능

  const [showAll, setShowAll] = useState(false);

  // 가져온 함수 getAvailableAppenments가 여기에 필요합니다
  // Available Appointments(사용 가능한 약속)를 얻으려면 사용자가 합격해야 합니다
  // 로그인한 사용자가 예약한 약속
  const { user } = useUser();

  const selectFn = useCallback(
    (data) => {
      console.log(data);
      return getAvailableAppointments(data, user);
    },
    [user]
  );

  /** ****************** END 2: filter appointments  ******************** */
  /** ****************** START 3: useQuery  ***************************** */
  // 현재 월의 예약에 대해 쿼리 호출 사용

  const queryClient = useQueryClient();
  useEffect(() => {
    const nextMonthYser = getNewMonthYear(monthYear, 1);
    queryClient.prefetchQuery(
      [queryKeys.appointments, nextMonthYser.year, nextMonthYser.month],
      () => getAppointments(nextMonthYser.year, nextMonthYser.month),
      commonOptions
    );
  }, [queryClient, monthYear]);

  // TODO: useQuery로 업데이트합니다!
  // 참고:
  // 1. 약속은 약속 날짜 맵(월일이 포함된 개체)입니다
  // 속성으로, 그리고 그날의 약속 배열을 값으로)

  // 2. getAppenments 쿼리 함수에는 monthYear가 필요합니다.해와
  // 월 년 월
  const fallback = {};
  const { data: appointments = fallback } = useQuery(
    [queryKeys.appointments, monthYear.year, monthYear.month],
    () => getAppointments(monthYear.year, monthYear.month),
    {
      select: showAll ? undefined : selectFn,
      ...commonOptions,
      refetchOnMount: true,
      refetchOnReconnect: true,
      refetchOnWindowFocus: true,
    }
  );

  /** ****************** END 3: useQuery  ******************************* */

  return { appointments, monthYear, updateMonthYear, showAll, setShowAll };
}
