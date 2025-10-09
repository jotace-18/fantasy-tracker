const db = require("../db/db");

function getAll(participantId) {
	const sql = `
		SELECT tr.id, tr.player_id, p.name AS player_name, t.name AS team_name,
					 tr.type, tr.amount, tr.transfer_date,
					 tr.from_participant_id, tr.to_participant_id,
					 CASE
						 WHEN tr.to_participant_id = ? THEN 'out'
						 WHEN tr.from_participant_id = ? THEN 'in'
						 ELSE 'none'
					 END AS direction
		FROM transfers tr
		JOIN players p ON p.id = tr.player_id
		JOIN teams t ON t.id = p.team_id
		WHERE tr.to_participant_id = ? OR tr.from_participant_id = ?
		ORDER BY tr.transfer_date ASC, tr.id ASC;
	`;
	return new Promise((resolve, reject) =>
		db.all(sql, [participantId, participantId, participantId, participantId], (err, rows) =>
			err ? reject(err) : resolve(rows)
		)
	);
}

async function getSummary(participantId) {
	const q = (sql, params=[]) => new Promise((res, rej)=> db.get(sql, params, (e,r)=> e?rej(e):res(r)));
	const invested = await q(`SELECT COALESCE(SUM(amount),0) AS s FROM transfers WHERE to_participant_id = ?`, [participantId]);
	const recovered = await q(`SELECT COALESCE(SUM(amount),0) AS s FROM transfers WHERE from_participant_id = ?`, [participantId]);
	const activeCount = await q(`SELECT COUNT(*) AS c FROM participant_players WHERE participant_id = ?`, [participantId]);
	const soldCount = await q(`SELECT COUNT(*) AS c FROM transfers WHERE from_participant_id = ?`, [participantId]);
	const total_invested = Number(invested?.s || 0);
	const total_recovered = Number(recovered?.s || 0);
	const net_profit = total_recovered - total_invested;
	const roi_percent = total_invested > 0 ? Number(((net_profit * 100) / total_invested).toFixed(2)) : null;
	return {
		total_invested,
		total_recovered,
		net_profit,
		roi_percent,
		active_count: Number(activeCount?.c || 0),
		sold_count: Number(soldCount?.c || 0),
	};
}

function getTopSales(participantId, limit = 10) {
	const sql = `
		WITH last_buy AS (
			SELECT b.player_id,
						 MAX(b.transfer_date) AS last_buy_date
			FROM transfers b
			WHERE b.to_participant_id = ?
			GROUP BY b.player_id
		)
		SELECT s.id, s.player_id, p.name AS player_name, t.name AS team_name,
					 s.amount AS sell_amount,
					 (
						 SELECT b.amount
						 FROM transfers b
						 WHERE b.player_id = s.player_id
							 AND b.to_participant_id = ?
							 AND b.transfer_date <= s.transfer_date
						 ORDER BY b.transfer_date DESC, b.id DESC
						 LIMIT 1
					 ) AS buy_amount,
					 (s.amount - COALESCE((
						 SELECT b.amount FROM transfers b
						 WHERE b.player_id = s.player_id AND b.to_participant_id = ? AND b.transfer_date <= s.transfer_date
						 ORDER BY b.transfer_date DESC, b.id DESC LIMIT 1
					 ), 0)) AS profit,
					 s.transfer_date
		FROM transfers s
		JOIN players p ON p.id = s.player_id
		JOIN teams t ON t.id = p.team_id
		WHERE s.from_participant_id = ?
		ORDER BY profit DESC, s.transfer_date DESC
		LIMIT ?;
	`;
	return new Promise((resolve, reject)=>
		db.all(sql, [participantId, participantId, participantId, participantId, limit], (err, rows)=> err?reject(err):resolve(rows))
	);
}

function getWorstSales(participantId, limit = 10) {
	const sql = `
		SELECT s.id, s.player_id, p.name AS player_name, t.name AS team_name,
					 s.amount AS sell_amount,
					 (
						 SELECT b.amount
						 FROM transfers b
						 WHERE b.player_id = s.player_id
							 AND b.to_participant_id = ?
							 AND b.transfer_date <= s.transfer_date
						 ORDER BY b.transfer_date DESC, b.id DESC
						 LIMIT 1
					 ) AS buy_amount,
					 (s.amount - COALESCE((
						 SELECT b.amount FROM transfers b
						 WHERE b.player_id = s.player_id AND b.to_participant_id = ? AND b.transfer_date <= s.transfer_date
						 ORDER BY b.transfer_date DESC, b.id DESC LIMIT 1
					 ), 0)) AS profit,
					 s.transfer_date
		FROM transfers s
		JOIN players p ON p.id = s.player_id
		JOIN teams t ON t.id = p.team_id
		WHERE s.from_participant_id = ?
		ORDER BY profit ASC, s.transfer_date DESC
		LIMIT ?;
	`;
	return new Promise((resolve, reject)=>
		db.all(sql, [participantId, participantId, participantId, limit], (err, rows)=> err?reject(err):resolve(rows))
	);
}

module.exports = { getAll, getSummary, getTopSales, getWorstSales };



function getAll(participantId) {
	const sql = `
		SELECT
			tr.id,
			tr.player_id,
			p.name AS player_name,
			t.name AS team_name,
			tr.type,
			tr.amount,
			tr.clause_value,
			tr.transfer_date,
			tr.from_participant_id,
			tr.to_participant_id
		FROM transfers tr
		LEFT JOIN players p ON p.id = tr.player_id
		LEFT JOIN teams t ON t.id = p.team_id
		WHERE tr.from_participant_id = ? OR tr.to_participant_id = ?
		ORDER BY datetime(tr.transfer_date) DESC;
	`;
	return new Promise((resolve, reject) =>
		db.all(sql, [participantId, participantId], (err, rows) =>
			err ? reject(err) : resolve(rows)
		)
	);
}

function getSummary(participantId) {
	const sqls = {
		invested: `SELECT COALESCE(SUM(amount),0) AS v FROM transfers WHERE to_participant_id = ? AND type IN ('buy','clause');`,
		recovered: `SELECT COALESCE(SUM(amount),0) AS v FROM transfers WHERE from_participant_id = ? AND type IN ('sell','clause');`,
		active: `SELECT COUNT(*) AS c FROM participant_players WHERE participant_id = ?;`,
		soldOps: `SELECT COUNT(*) AS c FROM transfers WHERE from_participant_id = ? AND type IN ('sell','clause');`,
	};

	function getOne(sql) {
		return new Promise((resolve) => db.get(sql, [participantId], (_e, r) => resolve(Number(r?.v ?? r?.c ?? 0))));
	}

	return Promise.all([
		getOne(sqls.invested),
		getOne(sqls.recovered),
		getOne(sqls.active),
		getOne(sqls.soldOps),
	]).then(([invested, recovered, activeCount, soldCount]) => {
		const net = recovered - invested;
		const roi = invested > 0 ? net / invested : 0;
		return {
			total_invested: invested,
			total_recovered: recovered,
			net_profit: net,
			roi_percent: Number((roi * 100).toFixed(2)),
			active_count: activeCount,
			sold_count: soldCount,
		};
	});
}

function getTopSales(participantId, limit = 5) {
	const sql = `
		WITH buys AS (
			SELECT player_id, COALESCE(SUM(amount),0) AS buy_sum
			FROM transfers
			WHERE to_participant_id = ? AND type IN ('buy','clause')
			GROUP BY player_id
		),
		sells AS (
			SELECT player_id, COALESCE(SUM(amount),0) AS sell_sum
			FROM transfers
			WHERE from_participant_id = ? AND type IN ('sell','clause')
			GROUP BY player_id
		)
		SELECT p.id AS player_id, p.name AS player_name, t.name AS team_name,
					 COALESCE(s.sell_sum,0) - COALESCE(b.buy_sum,0) AS profit,
					 COALESCE(s.sell_sum,0) AS recovered, COALESCE(b.buy_sum,0) AS invested
		FROM players p
		JOIN teams t ON t.id = p.team_id
		LEFT JOIN buys b ON b.player_id = p.id
		LEFT JOIN sells s ON s.player_id = p.id
		WHERE (s.sell_sum IS NOT NULL)
		ORDER BY profit DESC
		LIMIT ?;
	`;
	return new Promise((resolve, reject) =>
		db.all(sql, [participantId, participantId, limit], (err, rows) =>
			err ? reject(err) : resolve(rows)
		)
	);
}

function getWorstSales(participantId, limit = 5) {
	const sql = `
		WITH buys AS (
			SELECT player_id, COALESCE(SUM(amount),0) AS buy_sum
			FROM transfers
			WHERE to_participant_id = ? AND type IN ('buy','clause')
			GROUP BY player_id
		),
		sells AS (
			SELECT player_id, COALESCE(SUM(amount),0) AS sell_sum
			FROM transfers
			WHERE from_participant_id = ? AND type IN ('sell','clause')
			GROUP BY player_id
		)
		SELECT p.id AS player_id, p.name AS player_name, t.name AS team_name,
					 COALESCE(s.sell_sum,0) - COALESCE(b.buy_sum,0) AS profit,
					 COALESCE(s.sell_sum,0) AS recovered, COALESCE(b.buy_sum,0) AS invested
		FROM players p
		JOIN teams t ON t.id = p.team_id
		LEFT JOIN buys b ON b.player_id = p.id
		LEFT JOIN sells s ON s.player_id = p.id
		WHERE (s.sell_sum IS NOT NULL)
		ORDER BY profit ASC
		LIMIT ?;
	`;
	return new Promise((resolve, reject) =>
		db.all(sql, [participantId, participantId, limit], (err, rows) =>
			err ? reject(err) : resolve(rows)
		)
	);
}

module.exports = { getAll, getSummary, getTopSales, getWorstSales };
