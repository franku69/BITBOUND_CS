"""Run every walkthrough as Python; detect content/expected-output regressions."""
import contextlib,io,json,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
class Tutorials(unittest.TestCase):
    def test_walkthroughs(self):
        lessons=json.loads((ROOT/'adventure/tutorials.json').read_text())
        tasks=json.loads((ROOT/'app/curriculum.json').read_text())['items']
        self.assertEqual([x['id'] for x in lessons],[x['id'] for x in tasks])
        for lesson in lessons:
            with self.subTest(lesson=lesson['id']):
                self.assertEqual(len(lesson['choices']),3)
                self.assertIn(lesson['answer'],range(3))
                self.assertTrue(all(lesson[key].strip() for key in ['story','explain','code','question','feedback']))
                output=io.StringIO()
                sample={'q02':'Ada','q03':'4'}.get(lesson['id'],'')
                with contextlib.redirect_stdout(output):
                    exec(compile(lesson['code'],lesson['id'],'exec'),{'input':lambda:sample})
                self.assertEqual(output.getvalue().rstrip('\n'),lesson['output'])
if __name__=='__main__':unittest.main()
