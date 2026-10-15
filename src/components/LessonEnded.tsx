import { Link } from 'react-router-dom';
export function LessonEnded({ projector = false }: { projector?: boolean }) {
 return projector
  ? <main className="presentation"><section className="lesson-ended"><h1>課堂已結束</h1><p>多謝各位同學！</p></section></main>
  : <main className="shell"><section className="card"><h1>課堂已結束</h1><p>這個課堂代碼已停用（已按「結束課堂」或超過 24 小時）。</p><Link className="button primary" to="/start">開始新課堂</Link></section></main>;
}
