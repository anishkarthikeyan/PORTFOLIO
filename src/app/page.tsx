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
import { WorldZone } from "@/components/journey/WorldZone";
import { JourneyController } from "@/components/journey/JourneyController";
import { Hud } from "@/components/journey/Hud";
import { TitleScreen } from "@/components/journey/TitleScreen";
import journey from "@/components/journey/Journey.module.css";

export default function Home() {
  const show = getVisibleSections();
  // Each <WorldZone> is one world: its band (pipes + platforms) followed by the
  // sections that belong to it, all inside the same scenery. The controller
  // animates one character through every zone.
  return (
    <>
      <TitleScreen />
      <Hero />
      <div className={journey.root}>
        <WorldZone world="spawn">
          <WorldSelect />
        </WorldZone>
        <WorldZone world="projects">
          <ProjectArchive />
        </WorldZone>
        <WorldZone world="profile" lane>
          <Profile />
        </WorldZone>
        {(show.skills || show.dsa || show.systemDesign) && (
          <WorldZone world="skills">
            {show.skills && <Skills />}
            {show.dsa && <Dsa />}
            {show.systemDesign && <SystemDesign />}
          </WorldZone>
        )}
        <WorldZone world="archive">
          {show.experience && <Experience />}
          <Education />
          {show.achievements && <Achievements />}
        </WorldZone>
        <WorldZone world="contact">
          <Contact />
        </WorldZone>
        <Hud />
        <JourneyController />
      </div>
    </>
  );
}
