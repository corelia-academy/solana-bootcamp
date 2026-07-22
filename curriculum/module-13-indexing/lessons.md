# Nội dung bài học — Module 13

## 13.1 Vì sao cần indexer

RPC tối ưu cho state hiện tại và transaction access, không phải mọi query sản phẩm. Pagination, history và aggregate cần data model riêng.

## 13.2 RPC và indexer

RPC là nguồn chain data; indexer là derived view có thể stale/reorg/reprocess. Frontend phải biết dữ liệu nào cần authoritative read.

## 13.3 Anchor events/logs

Event thiết kế cho consumer: versioned fields, stable identifiers, actor và domain data. Không parse human log làm schema lâu dài.

## 13.4 Geyser

Geyser stream account/transaction updates từ validator/plugin pipeline. Hiểu commitment, slot ordering và reconnect.

## 13.5 Carbon/Yellowstone

Tổng quan framework/client giúp decode và consume stream; chọn theo deployment, language và ops requirements.

## 13.6 Event indexer

Consume event, derive unique key từ signature + instruction/event index, upsert idempotently và lưu slot/block time.

## 13.7 PostgreSQL

Thiết kế normalized domain table, unique constraints, indexes cho query thực tế và migration có version.

## 13.8 REST API

API có pagination, filters, bounded limit, validation và freshness metadata. Không expose query SQL tùy ý.

## Lab

Index Voting events, lưu Poll/Candidate/Vote projection và tạo endpoint leaderboard.

## Lab tự chọn

Lab nhận domain event của Voting App và biến thành record queryable. Starter có decoder/store interfaces; solution ingest idempotently theo `(signature, log_index)`, lưu slot và cung cấp API phân trang có giới hạn.

## Data flow

RPC/log source → decoder → normalized event → idempotent upsert → cursor/checkpoint → REST query. Reconnect phải tiếp tục từ checkpoint; backfill không tạo row trùng với realtime stream.

## Failure model và tests

Test duplicate delivery, out-of-order slot, malformed log, reconnect, backfill overlap và pagination limit. Không đánh dấu checkpoint trước khi persistence thành công. API không trả dataset vô hạn và không dùng indexer như nguồn authority cho transaction write.

## Hoàn thành module khi

Starter/solution chạy bằng fixture logs, test idempotency xanh, schema lưu signature/slot/program ID và README giải thích độ trễ/reorg/RPC trade-off.
