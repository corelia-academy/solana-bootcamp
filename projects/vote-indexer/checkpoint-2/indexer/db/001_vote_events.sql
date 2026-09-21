CREATE TABLE vote_events (
  signature    TEXT     NOT NULL,
  event_index  INTEGER  NOT NULL,
  slot         BIGINT   NOT NULL,
  block_time   BIGINT,
  program_id   TEXT     NOT NULL,
  version      SMALLINT NOT NULL,
  poll         TEXT     NOT NULL,
  candidate    TEXT     NOT NULL,
  voter        TEXT     NOT NULL,
  candidate_id INTEGER  NOT NULL,
  votes        BIGINT   NOT NULL,
  PRIMARY KEY (signature, event_index)
);

CREATE INDEX vote_events_by_poll
  ON vote_events (poll, slot DESC, signature DESC, event_index DESC);
