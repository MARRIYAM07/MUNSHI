import {Fragment,type ReactNode} from "react";

export type AppNavItem={
  id:string;
  label:string;
  href:string;
  icon:ReactNode;
  group?:string;
};

export type AppShellProps={
  navItems:readonly AppNavItem[];
  activeItemId:string;
  title:string;
  subtitle?:string;
  brand?:ReactNode;
  topActions?:ReactNode;
  sidebarFooter?:ReactNode;
  banner?:ReactNode;
  children:ReactNode;
};

export function AppShell({navItems,activeItemId,title,subtitle,brand,topActions,sidebarFooter,banner,children}:AppShellProps){
  let currentGroup:string|undefined;

  return <>
    {banner}
    <div className="shell">
      <aside className="side">
        <div className="side-brand">
          {brand??<span>MUNSHI<span className="dot">.</span></span>}
        </div>
        <nav className="side-nav" aria-label="Console navigation">
          {navItems.map(item=>{
            const groupChanged=item.group!==currentGroup;
            currentGroup=item.group;
            const active=item.id===activeItemId;
            return <Fragment key={item.id}>
              {groupChanged&&item.group?<div className="side-group-label">{item.group}</div>:null}
              <a className={`side-link${active?" active":""}`} href={item.href} aria-current={active?"page":undefined}>
                <span className="ic" aria-hidden="true">{item.icon}</span>
                <span className="lbl">{item.label}</span>
              </a>
            </Fragment>;
          })}
        </nav>
        {sidebarFooter?<div className="side-foot">{sidebarFooter}</div>:null}
      </aside>
      <header className="top">
        <div className="top-inner">
          <div className="top-title">
            <h1>{title}</h1>
            {subtitle?<div className="sub">{subtitle}</div>:null}
          </div>
          {topActions?<div className="top-actions">{topActions}</div>:null}
        </div>
      </header>
      <main className="app-main">{children}</main>
    </div>
  </>;
}
