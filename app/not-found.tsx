import Link from "next/link";
import { projects } from "@/lib/projects";

export default function NotFound() {
  return <main id="content" className="not-found">
    <div className="container">
      <p className="eyebrow">404</p>
      <h1>This page doesn’t exist.</h1>
      <p>The link may be out of date. The labs and case studies are all reachable from here:</p>
      <ul className="not-found-links">
        <li><Link href="/">Home</Link></li>
        {projects.map(project => <li key={project.slug}><Link href={`/projects/${project.slug}`}>{project.name}</Link></li>)}
      </ul>
    </div>
  </main>;
}
