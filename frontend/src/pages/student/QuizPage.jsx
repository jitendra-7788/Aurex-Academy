import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/client';
import Loading from '../../components/Loading';

export default function QuizPage() {
  const { quizId } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/quizzes/${quizId}/attempt`)
      .then((res) => setQuiz(res.data.data.quiz))
      .catch((err) => setError(err.response?.data?.message || 'Unable to load quiz'));
  }, [quizId]);

  const submit = async (e) => {
    e.preventDefault();
    const payload = {
      answers: Object.entries(answers).map(([questionId, selectedOptionId]) => ({
        questionId,
        selectedOptionId,
      })),
    };
    const { data } = await api.post(`/quizzes/${quizId}/submit`, payload);
    setResult(data.data.attempt);
  };

  if (error) return <div className="container page alert alert-error">{error}</div>;
  if (!quiz) return <Loading />;

  return (
    <div className="container page" style={{ maxWidth: 720 }}>
      <h1>{quiz.title}</h1>
      <p>{quiz.description}</p>
      <p className="muted">Passing score: {quiz.passingScore}% · Questions: {quiz.questionCount}</p>

      {result ? (
        <div className="card">
          <h3>{result.passed ? 'Passed' : 'Not passed'}</h3>
          <p>
            Score: {result.score}/{result.maxScore} ({result.percentage}%)
          </p>
          <ul>
            {(result.feedback || []).map((f) => (
              <li key={f.questionId}>
                {f.isCorrect ? 'Correct' : 'Incorrect'}
                {f.explanation ? ` — ${f.explanation}` : ''}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <form className="card" onSubmit={submit}>
          {(quiz.questions || []).map((q, idx) => (
            <fieldset key={q.id} style={{ border: 'none', marginBottom: '1.25rem', padding: 0 }}>
              <legend style={{ fontWeight: 700, marginBottom: '0.5rem' }}>
                {idx + 1}. {q.prompt}
              </legend>
              {(q.options || []).map((o) => (
                <label key={o.id} style={{ display: 'block', marginBottom: '0.35rem' }}>
                  <input
                    type="radio"
                    name={q.id}
                    required
                    onChange={() => setAnswers({ ...answers, [q.id]: o.id })}
                  />{' '}
                  {o.text}
                </label>
              ))}
            </fieldset>
          ))}
          <button className="btn btn-primary" type="submit">
            Submit answers
          </button>
        </form>
      )}
    </div>
  );
}
