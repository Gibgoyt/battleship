cheat player 1 ships
 WITH RECURSIVE dx(n) AS (SELECT 0 UNION ALL SELECT n+1 FROM dx WHERE n < 19), dy(n) AS (SELECT 0 UNION ALL SELECT n+1 FROM dy WHERE n < 19) SELECT DISTINCT char(65 + b.y + dy.n) || (b.x + dx.n + 1) AS cell FROM boats b JOIN dx ON dx.n < b.width JOIN dy ON dy.n < b.height WHERE b.player = 1 ORDER BY cell;

```sql
WITH RECURSIVE
  dx(n) AS (SELECT 0 UNION ALL SELECT n+1 FROM dx WHERE n < 19),
  dy(n) AS (SELECT 0 UNION ALL SELECT n+1 FROM dy WHERE n < 19)
SELECT DISTINCT
  char(65 + b.y + dy.n) || (b.x + dx.n + 1) AS cell
FROM boats b
JOIN dx ON dx.n < b.width
JOIN dy ON dy.n < b.height
WHERE b.player = 1
ORDER BY cell;
```:
