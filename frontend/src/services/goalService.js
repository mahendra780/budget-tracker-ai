import api from "./api";

export const getGoalProgress =
  async () => {
    const response =
      await api.get(
        "/goals/progress"
      );

    return response.data;
  };

export const getGoals = async () => {
  const response = await api.get("/goals");
  return response.data;
};
export const createGoal =
  async (goal) => {
    const response =
      await api.post(
        "/goals",
        goal
      );

    return response.data;
  };
export const updateGoal = async (
  id,
  goal
) => {
  const response = await api.put(
    `/goals/${id}`,
    goal
  );

  return response.data;
};

export const deleteGoal = async (
  id
) => {
  const response = await api.delete(
    `/goals/${id}`
  );

  return response.data;
};

export const createGoalContribution = async (
  goalId,
  contribution
) => {
  const response = await api.post(
    `/goals/${goalId}/contributions`,
    contribution
  );

  return response.data;
};

export const getGoalContributions = async (
  goalId
) => {
  const response = await api.get(
    `/goals/${goalId}/contributions`
  );

  return response.data;
};

export const getAllGoalContributions = async () => {
  const response = await api.get(
    "/goals/contributions/history/all"
  );

  return response.data;
};
