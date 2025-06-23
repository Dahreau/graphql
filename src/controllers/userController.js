import { useQuery } from "@apollo/client";
import { GET_PROFILE_INFOS } from "../queries/userQueries";

export function useUserProfile() {
  const { loading, error, data } = useQuery(GET_PROFILE_INFOS);

  return {
    data,
    loading,
    error,
  };
}
