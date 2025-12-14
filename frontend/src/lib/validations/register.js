import * as z from "zod";

export const registerFormSchema = z.object({
  username: z
    .string()
    .min(6, { message: "Username must be at least 6 characters." })
    .max(30, { message: "Username must be at most 30 characters." }),
  email: z
    .string()
    .min(1, { message: "Email is required." })
    .email({ message: "Please enter a valid email address." }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters." }),
});

export const registerDefaultValues = {
  username: "",
  email: "",
  password: "",
};
