import {
  pgTable,
  serial,
  text,
  integer,
  bigint,
  timestamp,
  boolean,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// role: customer | business | admin
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  phone: text("phone").notNull().unique(),
  passwordHash: text("password_hash"),
  name: text("name").notNull().default(""),
  role: text("role").notNull().default("customer"),
  isBlocked: boolean("is_blocked").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const otpCodes = pgTable("otp_codes", {
  id: serial("id").primaryKey(),
  phone: text("phone").notNull(),
  code: text("code").notNull(),
  attempts: integer("attempts").notNull().default(0),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  token: text("token").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
});

export const loginAttempts = pgTable("login_attempts", {
  id: serial("id").primaryKey(),
  phoneHash: text("phone_hash").notNull().unique(),
  failedAttempts: integer("failed_attempts").notNull().default(0),
  windowStartedAt: timestamp("window_started_at").notNull().defaultNow(),
  lockedUntil: timestamp("locked_until"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const trustedDevices = pgTable(
  "trusted_devices",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    lastUsedAt: timestamp("last_used_at").notNull().defaultNow(),
  },
  (t) => [index("trusted_devices_user_id_idx").on(t.userId)]
);

// status: pending | approved | suspended
export const garages = pgTable("garages", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  city: text("city").notNull(),
  district: text("district").notNull().default(""),
  address: text("address").notNull().default(""), // private
  phone: text("phone").notNull().default(""), // private
  services: text("services").array().notNull().default([]),
  experienceYears: integer("experience_years").notNull().default(0),
  workingHours: text("working_hours").notNull().default(""),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// status: open | booked | in_progress | completed | cancelled
export const serviceRequests = pgTable(
  "service_requests",
  {
    id: serial("id").primaryKey(),
    customerId: integer("customer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    carModel: text("car_model").notNull(),
    carYear: text("car_year").notNull().default(""),
    carColor: text("car_color").notNull().default(""),
    services: text("services").array().notNull().default([]),
    description: text("description").notNull().default(""),
    city: text("city").notNull(),
    status: text("status").notNull().default("open"),
    acceptedOfferId: integer("accepted_offer_id"),
    adminNote: text("admin_note").notNull().default(""),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("req_status_idx").on(t.status)]
);

export const requestMedia = pgTable("request_media", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id")
    .notNull()
    .references(() => serviceRequests.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(), // image | video
  fileName: text("file_name").notNull(),
  mime: text("mime").notNull(),
  size: integer("size").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// status: pending | accepted | rejected | withdrawn
export const offers = pgTable(
  "offers",
  {
    id: serial("id").primaryKey(),
    requestId: integer("request_id")
      .notNull()
      .references(() => serviceRequests.id, { onDelete: "cascade" }),
    garageId: integer("garage_id")
      .notNull()
      .references(() => garages.id, { onDelete: "cascade" }),
    price: bigint("price", { mode: "number" }).notNull(),
    estimatedDays: integer("estimated_days").notNull().default(1),
    availableAfterDays: integer("available_after_days").notNull().default(0),

    status: text("status").notNull().default("pending"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("offer_req_garage_uq").on(t.requestId, t.garageId)]
);

// status: scheduled | in_progress | completed | cancelled
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id")
    .notNull()
    .references(() => serviceRequests.id, { onDelete: "cascade" })
    .unique(),
  offerId: integer("offer_id")
    .notNull()
    .references(() => offers.id, { onDelete: "cascade" }),
  garageId: integer("garage_id")
    .notNull()
    .references(() => garages.id, { onDelete: "cascade" }),
  customerId: integer("customer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  scheduledAt: timestamp("scheduled_at").notNull(),
  status: text("status").notNull().default("scheduled"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  garageId: integer("garage_id")
    .notNull()
    .references(() => garages.id, { onDelete: "cascade" }),
  customerId: integer("customer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  bookingId: integer("booking_id")
    .notNull()
    .references(() => bookings.id, { onDelete: "cascade" })
    .unique(),
  rating: integer("rating").notNull(),
  comment: text("comment").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Admin mediation threads. Each thread belongs to a request and a non-admin participant.
export const messages = pgTable(
  "messages",
  {
    id: serial("id").primaryKey(),
    requestId: integer("request_id")
      .notNull()
      .references(() => serviceRequests.id, { onDelete: "cascade" }),
    participantId: integer("participant_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    senderId: integer("sender_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    readByAdmin: boolean("read_by_admin").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("msg_thread_idx").on(t.requestId, t.participantId)]
);

export type User = typeof users.$inferSelect;
export type Garage = typeof garages.$inferSelect;
export type ServiceRequest = typeof serviceRequests.$inferSelect;
export type Offer = typeof offers.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
