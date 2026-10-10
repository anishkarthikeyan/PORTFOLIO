import { Hero } from "@/components/hero/Hero";
import { WorldSelect } from "@/components/world/WorldSelect";
import { ProjectArchive } from "@/components/projects/ProjectArchive";
import { Profile } from "@/components/sections/Profile";
import { Skills } from "@/components/sections/Skills";
import { Dsa } from "@/components/sections/Dsa";
import { SystemDesign } from "@/components/sections/SystemDesign";
import { Experience } from "@/components/sections/Experience";
import { Education } from "@/components/sections/Education";
import { Achievements } from "@/components/sections/Achievements";
import { Contact } from "@/components/sections/Contact";
import { getVisibleSections } from "@/lib/content";

export default function Home() {
  const show = getVisibleSections();
  return (
    <>
      <Hero />
      <WorldSelect />
      <ProjectArchive />
      <Profile />
      {show.skills && <Skills />}
      {show.dsa && <Dsa />}
      {show.systemDesign && <SystemDesign />}
      {show.experience && <Experience />}
      <Education />
      {show.achievements && <Achievements />}
      <Contact />
    </>
  );
}
