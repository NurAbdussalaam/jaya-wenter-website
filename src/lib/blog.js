import blog from "../../content/blog.json";
import { abs } from "./util.js";

export function getPosts() {
  return (blog.posts || []).map((p) => {
    const legacy = !!p.link;
    const href = legacy ? "/blog/" + String(p.link).replace(/^\/?(blog\/)?/, "") : `/blog/${p.slug}/`;
    return { ...p, legacy, href, cover: p.cover ? abs(p.cover) : "" };
  });
}
