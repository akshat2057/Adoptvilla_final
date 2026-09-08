"use client";
import { useState } from "react";
export function DatabaseBrowser() {
    const [view, setView] = useState("stats");
    const [tables, setTables] = useState([]);
    const [selectedTable, setSelectedTable] = useState("");
    const [data, setData] = useState([]);
    const [stats, setStats] = useState([]);
    const [totalRows, setTotalRows] = useState(0);
    const [busy, setBusy] = useState(false);
    const [loading, setLoading] = useState(false);
    const [limit, setLimit] = useState(50);
    const [offset, setOffset] = useState(0);
    const [search, setSearch] = useState("");
    const [totalCount, setTotalCount] = useState(0);
    const [columns, setColumns] = useState([]);
    const loadStats = async () => {
        setBusy(true);
        try {
            const response = await fetch("/api/database?action=stats");
            const result = await response.json();
            setStats(result.stats);
            setTotalRows(result.totalRows);
            setTables(result.stats.map((s) => s.table));
        }
        finally {
            setBusy(false);
        }
    };
    const loadTable = async (tableName, searchTerm = "") => {
        setLoading(true);
        try {
            const url = `/api/database?action=query&table=${tableName}&limit=${limit}&offset=${offset}${searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ""}`;
            const response = await fetch(url);
            const result = await response.json();
            setData(result.rows);
            setTotalCount(result.totalCount);
            if (result.rows.length > 0) {
                setColumns(Object.keys(result.rows[0]));
            }
        }
        finally {
            setLoading(false);
        }
    };
    const handleSelectTable = async (tableName) => {
        setSelectedTable(tableName);
        setOffset(0);
        setSearch("");
        await loadTable(tableName);
    };
    const handleSearch = (e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        const searchTerm = String(form.get("search"));
        setSearch(searchTerm);
        setOffset(0);
        loadTable(selectedTable, searchTerm);
    };
    const handleExport = async () => {
        const url = `/api/database?action=export&table=${selectedTable}`;
        const response = await fetch(url);
        const blob = await response.blob();
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${selectedTable}.json`;
        a.click();
    };
    return (<section className="database-browser">
      <div className="db-header">
        <h2>📊 Database Browser</h2>
        <div className="db-tabs">
          <button className={view === "stats" ? "active" : ""} onClick={() => {
            setView("stats");
            loadStats();
        }}>
            Statistics
          </button>
          <button className={view === "browser" ? "active" : ""} onClick={() => setView("browser")}>
            Browse Tables
          </button>
        </div>
      </div>

      {view === "stats" && (<div className="db-stats">
          <div className="stats-summary">
            <article>
              <span>TOTAL TABLES</span>
              <b>{tables.length}</b>
            </article>
            <article>
              <span>TOTAL RECORDS</span>
              <b>{totalRows.toLocaleString()}</b>
            </article>
          </div>
          <div className="stats-table">
            <table>
              <thead>
                <tr>
                  <th>Table Name</th>
                  <th>Record Count</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((stat) => (<tr key={stat.table}>
                    <td>{stat.table}</td>
                    <td>{stat.rows.toLocaleString()}</td>
                  </tr>))}
              </tbody>
            </table>
            {!stats.length && <div className="record-empty">No tables found. Load statistics first.</div>}
          </div>
        </div>)}

      {view === "browser" && (<div className="db-browser">
          <div className="db-sidebar">
            <h3>Tables</h3>
            <div className="table-list">
              {!tables.length ? (<button onClick={loadStats} className="primary" style={{ width: "100%" }}>
                  Load Tables
                </button>) : (tables.map((tableName) => (<button key={tableName} className={selectedTable === tableName ? "active" : ""} onClick={() => handleSelectTable(tableName)}>
                    {tableName}
                  </button>)))}
            </div>
          </div>

          {selectedTable && (<div className="db-content">
              <div className="db-top">
                <h3>{selectedTable}</h3>
                <div className="db-controls">
                  <form onSubmit={handleSearch} style={{ display: "flex", gap: "8px" }}>
                    <input type="text" name="search" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}/>
                    <button type="submit" className="primary" disabled={loading}>
                      Search
                    </button>
                  </form>
                  <button className="primary" onClick={handleExport} disabled={loading}>
                    📥 Export JSON
                  </button>
                </div>
              </div>

              <div className="db-table-wrap">
                {data.length > 0 ? (<>
                    <table>
                      <thead>
                        <tr>
                          {columns.slice(0, 8).map((col) => (<th key={col}>{col}</th>))}
                          {columns.length > 8 && <th>+{columns.length - 8} more</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((row, idx) => (<tr key={idx}>
                            {columns.slice(0, 8).map((col) => (<td key={col} title={String(row[col] ?? "")}>
                                {formatValue(row[col])}
                              </td>))}
                          </tr>))}
                      </tbody>
                    </table>
                    <div className="db-pagination">
                      <small>
                        Showing {offset + 1}–{Math.min(offset + limit, totalCount)} of {totalCount.toLocaleString()}
                      </small>
                      <div>
                        <button disabled={offset === 0 || loading} onClick={() => setOffset(Math.max(0, offset - limit))}>
                          ← Previous
                        </button>
                        <button disabled={offset + limit >= totalCount || loading} onClick={() => setOffset(offset + limit)}>
                          Next →
                        </button>
                      </div>
                    </div>
                  </>) : (<div className="record-empty">{loading ? "Loading..." : "No records found"}</div>)}
              </div>
            </div>)}

          {!selectedTable && (<div className="record-empty" style={{ gridColumn: "2", padding: "40px" }}>
              Select a table to browse
            </div>)}
        </div>)}
    </section>);
}
function formatValue(value) {
    if (value === null || value === undefined)
        return "—";
    if (typeof value === "boolean")
        return value ? "✓" : "✗";
    if (typeof value === "object")
        return JSON.stringify(value).slice(0, 50) + "…";
    const str = String(value);
    return str.length > 50 ? str.slice(0, 47) + "…" : str;
}
