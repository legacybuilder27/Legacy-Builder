import { getSession } from "@/lib/auth/session";
import { projectContext, publicUser } from "@/lib/actions/context";
import { getDb } from "@/lib/db";
import { ProjectNav } from "@/components/ProjectNav";
import { Shell } from "@/components/Shell";

export async function generateMetadata({ params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    const session = await getSession();
    if (!session) return { title: "Legacy Builder" };
    const db = await getDb();
    const project = await db.getProject(projectId);
    if (!project || project.userId !== session.uid) return { title: "Legacy Builder" };
    return { title: `${project.parentName} · Legacy Builder` };
  } catch {
    return { title: "Legacy Builder" };
  }
}

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { user } = await projectContext(projectId);
  return (
    <Shell user={publicUser(user)}>
      <ProjectNav projectId={projectId} />
      {children}
    </Shell>
  );
}
