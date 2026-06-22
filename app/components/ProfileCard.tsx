import Image from 'next/image'
import CurtainLink from './CurtainLink'
import profile from '@/profile.json'
import { BlueskyIcon, GitHubIcon, LinkedInIcon, XIcon, YouTubeIcon } from './icons'
import styles from './ProfileCard.module.css'

/**
 * Homepage profile / bio card. All content is driven by the root-level
 * `profile.json` -- swap the photo in /public and edit that file to make this
 * your own. No code changes needed.
 */
export default function ProfileCard() {
  const { name, role, location, tagline, photo, links } = profile

  return (
    <aside className={styles.card} aria-label="Profile">
      <CurtainLink
        href="/me"
        className={styles.photoLink}
        curtainTransition
        aria-label={`About ${name}`}
      >
        <Image
          src={photo}
          alt={name}
          width={120}
          height={120}
          className={styles.photo}
          priority
        />
      </CurtainLink>
      <div className={styles.body}>
        <span className={styles.name}>{name}</span>
        <span className={styles.meta}>
          {role} <span className={styles.metaAccent}>&middot;</span> {location}
        </span>
        {tagline && <span className={styles.tagline}>{tagline}</span>}
        <span className={styles.about}>
          More about{" "}
          <CurtainLink href="/me" curtainTransition>
            me
          </CurtainLink>{" "}
          and what I&apos;m{" "}
          <CurtainLink href="/building" curtainTransition>
            building
          </CurtainLink>
        </span>
        <div className={styles.links}>
          {links.x && <XIcon href={links.x} className={styles.link} />}
          {links.linkedin && <LinkedInIcon href={links.linkedin} className={styles.link} />}
          {links.github && <GitHubIcon href={links.github} className={styles.link} />}
          {links.youtube && <YouTubeIcon href={links.youtube} className={styles.link} />}
          {links.bluesky && <BlueskyIcon href={links.bluesky} className={styles.link} />}
        </div>
      </div>
    </aside>
  )
}
