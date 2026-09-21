CREATE TABLE checkpoints (
  name      TEXT   PRIMARY KEY,
  signature TEXT   NOT NULL,
  slot      BIGINT NOT NULL
);
