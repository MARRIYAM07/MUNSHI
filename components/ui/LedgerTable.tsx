import type {Key,ReactNode} from "react";
import {StatusPill,type StatusValue} from "./StatusPill";

type ColumnBase<Row>={
  id:string;
  header:ReactNode;
  headerClassName?:string;
  className?:string|((row:Row)=>string|undefined);
};

export type LedgerColumn<Row>=ColumnBase<Row>&(
  |{render:(row:Row)=>ReactNode;status?:never}
  |{status:(row:Row)=>StatusValue;render?:never}
);

export type LedgerTableProps<Row>={
  rows:readonly Row[];
  columns:readonly LedgerColumn<Row>[];
  getRowKey:(row:Row)=>Key;
  getRowStatus?:(row:Row)=>StatusValue|undefined;
  caption?:string;
  emptyMessage?:string;
};

export function LedgerTable<Row>({rows,columns,getRowKey,getRowStatus,caption,emptyMessage="No ledger entries yet."}:LedgerTableProps<Row>){
  return <div className="table-scroll">
    <table className="ledger-table">
      {caption?<caption>{caption}</caption>:null}
      <thead>
        <tr>{columns.map(column=><th key={column.id} className={column.headerClassName}>{column.header}</th>)}</tr>
      </thead>
      <tbody>
        {rows.length===0?<tr><td colSpan={columns.length}>{emptyMessage}</td></tr>:rows.map(row=>{
          const rowStatus=getRowStatus?.(row);
          return <tr key={getRowKey(row)} className={rowStatus}>
            {columns.map(column=>{
              const className=typeof column.className==="function"?column.className(row):column.className;
              return <td key={column.id} className={className}>
                {column.status?<StatusPill value={column.status(row)}/>:column.render(row)}
              </td>;
            })}
          </tr>;
        })}
      </tbody>
    </table>
  </div>;
}
