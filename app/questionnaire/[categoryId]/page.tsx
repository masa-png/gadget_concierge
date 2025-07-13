import QuestionDisplay from "../../_components/features/questionnaire/question-display";

<QuestionDisplay
  categoryId="smartphone_bodies" // データベースの実際のカテゴリID
  onComplete={(sessionId) => {
    console.log("診断完了!", sessionId);
    // 結果画面への遷移
  }}
/>;
