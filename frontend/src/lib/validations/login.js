import * as z from "zod";

export const loginFormSchema = z.object({
  username: z
    .string()
    .min(6, { message: "Username must be at least 6 characters." })
    .max(30, { message: "Username must be at most 30 characters." }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters." }),
});

export const loginDefaultValues = {
  username: "",
  password: "",
};
